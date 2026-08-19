import { error, fail, type Actions, redirect } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, sql } from 'drizzle-orm'
import sharp from 'sharp'
import { storage } from '$lib/storage'
import { acceptablePrefixes } from '$lib/security-manager.svelte'
import type { PageServerLoad } from './$types'
import { failIfCannotPerformAction } from '$lib/server/permissions'

export const load: PageServerLoad = async ({ cookies, locals }) => {
	failIfCannotPerformAction(locals.user, 'createProject')

	// 2. Fetch the user's current link status from the DB
	const dbUser = await db.query.user.findFirst({
		where: eq(table.user.id, locals.user.id),
		columns: {
			scratchUsername: true,
		},
	})

	return {
		isLinked: !!dbUser?.scratchUsername,
		linkedUsername: dbUser?.scratchUsername,
	}
}

export const actions: Actions = {
	uploadProjectJson: async ({ request, locals }) => {
		failIfCannotPerformAction(locals.user, 'createProject')
		const { session, user } = locals
		if (!session || !user) return fail(401, { message: 'Unauthorized' })

		const formData = await request.formData()
		const jsonFile = formData.get('projectJson') as File
		const customThumb = formData.get('thumbnail') as File
		const title = (formData.get('title') as string) || 'Untitled'
		const notes = (formData.get('notes') as string) || ''

		if (!jsonFile || jsonFile.size === 0) {
			return fail(400, { message: 'No project configuration provided' })
		}

		try {
			const jsonText = await jsonFile.text()
			let projectJson: any
			try {
				projectJson = JSON.parse(jsonText)
			} catch (e) {
				return fail(400, { message: 'Invalid project.json format' })
			}

			if (locals.user.rank === 0) {
				const extensions = projectJson.extensions || []
				const restrictedExtensions = [
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

			if (customThumb && customThumb.size > 0 && customThumb.type.startsWith('image/')) {
				const thumbBuffer = Buffer.from(await customThumb.arrayBuffer())
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

			return { success: true, projectId }
		} catch (e) {
			console.error(e)
			return fail(500, { message: 'Failed to upload project.json' })
		}
	},

	uploadAsset: async ({ request, locals }) => {
		failIfCannotPerformAction(locals.user, 'createProject')
		const { session, user } = locals
		if (!session || !user) return fail(401, { message: 'Unauthorized' })

		const formData = await request.formData()
		const projectId = formData.get('projectId') as string
		const assetFile = formData.get('asset') as File
		const assetName = formData.get('name') as string

		if (!projectId || !assetFile || !assetName) {
			return fail(400, { message: 'Missing project ID, asset file, or name' })
		}

		// Verify project ownership
		const project = await db.query.project.findFirst({
			where: eq(table.project.id, projectId),
			columns: { userId: true },
		})

		if (!project || project.userId !== user.id) {
			return fail(403, { message: 'Unauthorized to modify this project' })
		}

		try {
			const buffer = Buffer.from(await assetFile.arrayBuffer())
			await storage.write(`projects/${projectId}/${assetName}`, buffer)
			return { success: true }
		} catch (e) {
			console.error(e)
			return fail(500, { message: 'Failed to upload asset' })
		}
	},
}
