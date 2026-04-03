import { error, fail, type Actions, redirect } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import JSZip from 'jszip'
import sharp from 'sharp'
import { storage } from '$lib/storage'
import { acceptablePrefixes } from '$lib/security-manager.svelte'

const MAX_TOTAL_UNCOMPRESSED_SIZE = 100 * 1024 * 1024

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { session, user } = locals
		if (!session || !user) return fail(401, { message: 'Unauthorized' })

		const formData = await request.formData()
		const file = formData.get('projectFile') as File
		const customThumb = formData.get('thumbnail') as File // New manual thumb field
		const title = (formData.get('title') as string) || 'Untitled'
		const notes = (formData.get('notes') as string) || ''

		if (!file || file.size === 0) return fail(400, { message: 'No project file provided' })

		try {
			const arrayBuffer = await file.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)
			const zip = new JSZip()
			const contents = await zip.loadAsync(buffer)

			// --- 1. ZIP BOMB & FOLDER PREVENTIONS ---
			let totalUncompressedSize = 0
			for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
				if (zipEntry.dir || relativePath.includes('/')) {
					return fail(400, { message: 'Invalid project: Nested directories are not allowed.' })
				}
				const entrySize = (zipEntry as any)._data.uncompressedSize || 0
				totalUncompressedSize += entrySize

				if (totalUncompressedSize > MAX_TOTAL_UNCOMPRESSED_SIZE) {
					return fail(400, { message: 'Project exceeds uncompressed size limit.' })
				}
			}

			const jsonFile = contents.file('project.json')
			if (!jsonFile) return fail(400, { message: 'Invalid project: project.json missing' })
			const projectJson = JSON.parse(await jsonFile.async('string'))

			if (locals.user.rank === 0) {
				const extensions = projectJson.extensions
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
				const notUploadableForNoobs =
					extensions.filter((x) => restrictedExtensions.includes(x)).length !== 0 ||
					Object.values(projectJson.extensionURLs).filter(
						(x) => !acceptablePrefixes.some((prefix) => x.startsWith(prefix)),
					).length !== 0

				if (notUploadableForNoobs)
					return fail(500, {
						message:
							'Your account has not ranked up yet and cannot use some extensions in this project.',
					})
			}

			// --- 2. DATABASE RECORD CREATION ---
			const [newProject] = await db
				.insert(table.project)
				.values({
					userId: user.id,
					title: title.slice(0, 150),
					notes: notes.slice(0, 2000),
					json: projectJson,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning()

			const projectId = newProject.id
			const projectBaseDir = `projects/${projectId}`

			// --- 3. ASSET UPLOADS ---
			const assetUploads: Promise<void>[] = []
			contents.forEach((relativePath, zipEntry) => {
				if (relativePath === 'project.json') return
				const uploadTask = async () => {
					const fileData = await zipEntry.async('nodebuffer')
					await storage.write(`${projectBaseDir}/${relativePath}`, fileData)
				}
				assetUploads.push(uploadTask())
			})

			// --- 4. THUMBNAIL LOGIC (Sharp Integration) ---
			let thumbBuffer: Buffer | null = null

			// Priority 1: User uploaded a custom thumbnail
			if (customThumb && customThumb.size > 0 && customThumb.type.startsWith('image/')) {
				thumbBuffer = Buffer.from(await customThumb.arrayBuffer())
			}
			// Priority 2: Fallback to internal zip thumbnail
			else {
				const internalThumb = contents.file('thumbnail.png') || contents.file('thumbnail.jpg')
				if (internalThumb) {
					thumbBuffer = await internalThumb.async('nodebuffer')
				}
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

			await Promise.all(assetUploads)

			throw redirect(303, `/projects/${projectId}`)
		} catch (err: any) {
			if (err.status === 303) throw err
			console.error('Upload Error:', err)
			return fail(500, { message: 'Failed to process project' })
		}
	},
}
