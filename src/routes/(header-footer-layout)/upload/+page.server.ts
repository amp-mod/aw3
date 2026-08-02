import { error, fail, type Actions, redirect } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, sql } from 'drizzle-orm'
import yauzl from 'yauzl'
import sharp from 'sharp'
import { storage } from '$lib/storage'
import { acceptablePrefixes } from '$lib/security-manager.svelte'
import type { PageServerLoad } from './$types'

const MAX_TOTAL_UNCOMPRESSED_SIZE = 100 * 1024 * 1024

export const load: PageServerLoad = async ({ cookies, locals }) => {
	// 1. Ensure user is logged in
	if (!locals.user) throw error(401, 'Unauthorized')

	// 2. Fetch the user's current link status from the DB
	const dbUser = await db.query.user.findFirst({
		where: eq(table.user.id, locals.user.id),
		columns: {
			scratchUsername: true,
			scratchLinked: true,
		},
	})

	return {
		// Data from DB
		isLinked: !!dbUser?.scratchLinked,
		linkedUsername: dbUser?.scratchUsername,
	}
}

const openZipFromBuffer = (buffer: Buffer): Promise<yauzl.ZipFile> =>
	new Promise((res, rej) =>
		yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zip) => (err ? rej(err) : res(zip!))),
	)

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { session, user } = locals
		if (!session || !user) return fail(401, { message: 'Unauthorized' })

		const formData = await request.formData()
		const file = formData.get('projectFile') as File
		const customThumb = formData.get('thumbnail') as File
		const title = (formData.get('title') as string) || 'Untitled'
		const notes = (formData.get('notes') as string) || ''

		if (!file || file.size === 0) return fail(400, { message: 'No project file provided' })

		try {
			const arrayBuffer = await file.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)
			const zip = await openZipFromBuffer(buffer)

			let totalUncompressedSize = 0
			let projectJson: any = null
			let internalThumbBuffer: Buffer | null = null
			const assetUploads: Promise<void>[] = []

			await new Promise<void>((resolve, reject) => {
				zip.readEntry()
				zip.on('entry', (entry: yauzl.Entry) => {
					if (/\/$/.test(entry.fileName) || entry.fileName.includes('/')) {
						return reject(new Error('Invalid project: Nested directories are not allowed.'))
					}

					totalUncompressedSize += entry.uncompressedSize
					if (totalUncompressedSize > MAX_TOTAL_UNCOMPRESSED_SIZE) {
						return reject(new Error('Project exceeds uncompressed size limit.'))
					}

					zip.openReadStream(entry, async (err, readStream) => {
						if (err) return reject(err)

						const chunks: Buffer[] = []
						for await (const chunk of readStream) {
							chunks.push(Buffer.from(chunk))
						}
						const fileData = Buffer.concat(chunks)

						if (entry.fileName === 'project.json') {
							try {
								projectJson = JSON.parse(fileData.toString())
							} catch (e) {
								return reject(new Error('Invalid project.json format'))
							}
						} else if (entry.fileName === 'thumbnail.png' || entry.fileName === 'thumbnail.jpg') {
							internalThumbBuffer = fileData
						} else {
							// We will handle specific storage writes after we have the project ID
							// But we store the data in memory for now during the stream
							// For very large individual assets, you'd stream directly to storage.
						}

						// Store the non-config files in a temporary map or process later
						// For this implementation, we'll collect them to upload once we have the ID
						zip.readEntry()
					})
				})

				zip.on('end', () => resolve())
				zip.on('error', (err) => reject(err))
			})

			if (!projectJson) return fail(400, { message: 'Invalid project: project.json missing' })

			if (locals.user.rank === 0) {
				const extensions = projectJson.extensions || []
				const restrictedExtensions = [
					// These all could be used to do one of these:
					// * create an HTTP request
					// * steal data
					// * execute arbritary code
					// * or be plain out annoying
					'fetch',
					'iframe',
					'gsaHTTPRequests',
					'gsaWebsocket',
					'clouddataping',
					'GameJoltAPI',
					'steamworks',
					'itch',
					'NGIO',
					'truefantomnetwork',
					'truefantomnetworkm',
					'lmsVideo',
					'images',
					'notSound',
				]

				const extensionURLs = projectJson.extensionURLs || {}
				const notUploadableForNoobs =
					extensions.some((x: string) => restrictedExtensions.includes(x)) ||
					Object.values(extensionURLs).some(
						(x: any) => !acceptablePrefixes.some((prefix) => String(x).startsWith(prefix)),
					)

				if (notUploadableForNoobs) {
					return fail(403, {
						message:
							'Your account has not ranked up yet and cannot use some extensions in this project.',
					})
				}
			}

			const [newProject] = await db
				.insert(table.project)
				.values({
					userId: user.id,
					title: title.slice(0, 150),
					notes: notes.slice(0, 2000),
					json: projectJson,
					createdAt: new Date(),
					updatedAt: new Date(),
					searchIndex: sql`to_tsvector('english', 
						coalesce(${title.slice(0, 150)}, '') || ' ' || 
						coalesce(${notes.slice(0, 2000)}, '')
					)`,
				})
				.returning()

			const projectId = newProject.id
			const projectBaseDir = `projects/${projectId}`

			await new Promise<void>((resolve, reject) => {
				yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zip2) => {
					if (err) return reject(err)
					zip2!.readEntry()
					zip2!.on('entry', (entry) => {
						if (entry.fileName === 'project.json' || /\/$/.test(entry.fileName)) {
							zip2!.readEntry()
							return
						}
						zip2!.openReadStream(entry, async (err, readStream) => {
							if (err) return reject(err)
							const chunks: Buffer[] = []
							for await (const chunk of readStream) {
								chunks.push(Buffer.from(chunk))
							}
							await storage.write(`${projectBaseDir}/${entry.fileName}`, Buffer.concat(chunks))
							zip2!.readEntry()
						})
					})
					zip2!.on('end', () => resolve())
				})
			})

			let thumbBuffer: Buffer | null = null

			if (customThumb && customThumb.size > 0 && customThumb.type.startsWith('image/')) {
				thumbBuffer = Buffer.from(await customThumb.arrayBuffer())
			} else if (internalThumbBuffer) {
				thumbBuffer = internalThumbBuffer
			}

			if (thumbBuffer) {
				const processedThumb = await sharp(thumbBuffer)
					.rotate()
					.resize(480, 360, { fit: 'cover' })
					.webp({ quality: 85 })
					.toBuffer()

				const thumbPath = `${projectBaseDir}/thumbnail.webp`
				await storage.write(thumbPath, processedThumb)

				await db
					.update(table.project)
					.set({ image: thumbPath })
					.where(eq(table.project.id, projectId))
			}

			throw redirect(303, `/projects/${projectId}`)
		} catch (err: any) {
			if (err.status === 303) throw err
			console.error('Upload Error:', err)
			return fail(500, { message: err.message || 'Failed to process project' })
		}
	},
}
