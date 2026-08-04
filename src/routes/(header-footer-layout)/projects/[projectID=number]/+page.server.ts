import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad, Actions } from './$types'
import { storage } from '$lib/storage'
import { form } from '$app/server'
import { isProfane } from '$lib/server/bad-word-checker'

export const load: PageServerLoad = async ({ params, locals }) => {
	const projectId = Number(params.projectID)

	if (isNaN(projectId)) {
		throw error(400, 'Invalid Project ID')
	}

	const project = await db.query.project.findFirst({
		where: eq(table.project.id, projectId),
		columns: {
			id: true,
			title: true,
			notes: true,
			userId: true,
			createdAt: true,
			updatedAt: true,
			status: true,
			moderatorNote: true,
			original: true,
		},
	})

	if (!project) {
		throw error(404, { message: 'Project not found' })
	}
	if (project.status !== 'shared') {
		const isOwner = locals.user?.id === project.userId
		const isAdmin = (locals.user?.rank ?? 0) >= 2

		if (!isOwner && !isAdmin) {
			throw error(404, { message: 'Project not found' })
		}
	}

	const author = await db.query.user.findFirst({
		where: eq(table.user.id, project.userId),
	})

	const originalProjectIfRemixed = project.original
		? await db.query.project.findFirst({
				where: eq(table.project.id, project.original),
				columns: { id: true, title: true, userId: true },
			})
		: null
	const originalAuthor = originalProjectIfRemixed
		? await db.query.user.findFirst({
				where: eq(table.user.id, originalProjectIfRemixed.userId),
				columns: { id: true, username: true },
			})
		: null

	// Check if project is currently featured
	const featured = await db.query.featuredProject.findFirst({
		where: eq(table.featuredProject.projectId, projectId),
	})

	return {
		project,
		isFeatured: !!featured,
		author: {
			username: author?.username ?? 'Unknown User',
			id: author?.id,
			hasPFP: author?.hasPFP,
		},
		isRemix: !!project.original,
		originalProject: originalProjectIfRemixed
			? {
					id: originalProjectIfRemixed.id,
					title: originalProjectIfRemixed.title,
					author: originalAuthor,
				}
			: null,
	}
}

export const actions: Actions = {
	renameProject: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' })
		const projectId = Number(params.projectID)
		const formData = await request.formData()
		const newTitle = formData.get('title')?.toString()

		if (!newTitle || newTitle.length < 1) return fail(400, { message: 'Title is required' })

		const project = await db.query.project.findFirst({ where: eq(table.project.id, projectId) })
		if (!project) return fail(404, { message: 'Project not found' })

		if (project.userId !== locals.user.id && locals.user.rank < 2) {
			return fail(403, { message: 'Forbidden' })
		}

		if (isProfane(newTitle)) {
			return fail(400, { message: 'Profanity detected' })
		}

		await db.update(table.project).set({ title: newTitle }).where(eq(table.project.id, projectId))
		return { success: true }
	},

	editNotes: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' })
		const projectId = Number(params.projectID)
		const formData = await request.formData()
		const notes = formData.get('notes')?.toString() ?? ''

		const project = await db.query.project.findFirst({ where: eq(table.project.id, projectId) })
		if (!project) return fail(404, { message: 'Project not found' })

		if (project.userId !== locals.user.id && locals.user.rank < 2) {
			return fail(403, { message: 'Forbidden' })
		}
		if (isProfane(notes)) {
			return fail(400, { message: 'Profanity detected' })
		}

		await db.update(table.project).set({ notes }).where(eq(table.project.id, projectId))
		return { success: true }
	},

	featureProject: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.rank < 2) return fail(403, { message: 'Unauthorized' })

		const projectId = Number(params.projectID)
		const formData = await request.formData()
		const why = formData.get('why')?.toString() ?? ''

		const existing = await db.query.featuredProject.findFirst({
			where: eq(table.featuredProject.projectId, projectId),
		})

		if (!existing) {
			await db.insert(table.featuredProject).values({ projectId, why })
			await db.insert(table.auditLog).values({
				action: 'feature_project',
				actorId: locals.user.id,
				targetId: projectId,
				targetType: 'project',
				extra: { why },
			})
		}

		return { success: true }
	},

	unfeatureProject: async ({ params, locals }) => {
		if (!locals.user || locals.user.rank < 2) return fail(403, { message: 'Unauthorized' })

		const projectId = Number(params.projectID)
		await db.delete(table.featuredProject).where(eq(table.featuredProject.projectId, projectId))

		await db.insert(table.auditLog).values({
			action: 'unfeature_project',
			actorId: locals.user.id,
			targetId: projectId,
			targetType: 'project',
		})

		return { success: true }
	},

	remixProject: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' })
		const projectId = Number(params.projectID)

		const project = await db.query.project.findFirst({ where: eq(table.project.id, projectId) })
		if (!project) return fail(404, { message: 'Project not found' })

		if (project.status !== 'shared' && project.userId !== locals.user.id && locals.user.rank < 2) {
			return fail(403, { message: 'Forbidden' })
		}

		const [newProject] = await db
			.insert(table.project)
			.values({
				title: `${project.title} remix`,
				userId: locals.user.id,
				original: project.id,
				image: project.image,
				status: 'unshared',
				json: project.json,
				notes: project.notes,
			})
			.returning()

		await db.insert(table.auditLog).values({
			action: 'remix_project',
			actorId: locals.user.id,
			targetId: projectId,
			targetType: 'project',
			extra: { newProjectId: newProject.id },
		})

		try {
			const projectBaseDir = `projects/${projectId}`

			const files = storage.list(projectBaseDir, { recursive: true })

			for await (const file of files) {
				if (file.type === 'directory') continue

				const relativePath = file.path.slice(projectBaseDir.length + 1)
				const destinationPath = `projects/${newProject.id}/${relativePath}`

				const fileData = await storage.read(file.path)

				await storage.write(destinationPath, fileData)
			}
		} catch (err) {
			fail(500, { message: 'Failed to remix project' })
		}

		redirect(307, `/projects/${newProject.id}`)
	},

	shareProject: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' })
		const projectId = Number(params.projectID)

		const project = await db.query.project.findFirst({ where: eq(table.project.id, projectId) })
		if (!project) return fail(404, { message: 'Project not found' })

		if (project.userId !== locals.user.id && locals.user.rank < 2) {
			return fail(403, { message: 'Forbidden' })
		}

		if (project.status === 'banned') {
			return fail(403, { message: 'Cannot share a banned project' })
		}

		await db.update(table.project).set({ status: 'shared' }).where(eq(table.project.id, projectId))

		await db.insert(table.auditLog).values({
			action: 'share_project',
			actorId: locals.user.id,
			targetId: projectId,
			targetType: 'project',
		})

		return { success: true }
	},

	banProject: async ({ params, locals, request }) => {
		if (!locals.user || locals.user.rank < 2) return fail(403, { message: 'Unauthorized' })
		const projectId = Number(params.projectID)

		const project = await db.query.project.findFirst({ where: eq(table.project.id, projectId) })
		if (!project) return fail(404, { message: 'Project not found' })
		const formData = await request.formData()
		const message = formData.get('moderatorNote')?.toString() ?? ''

		await db
			.update(table.project)
			.set({ status: 'banned', moderatorNote: message })
			.where(eq(table.project.id, projectId))

		await db.insert(table.auditLog).values({
			action: 'ban_project',
			actorId: locals.user.id,
			targetId: projectId,
			targetType: 'project',
			extra: { message },
		})

		await db.insert(table.notification).values({
			recipientId: project.userId,
			type: 'project_banned',
			metadata: {
				projID: project.id,
				projTitle: project.title,
				title: `${message}`,
			},
			link: `/projects/${project.id}`,
		})

		return { success: true }
	},

	unbanProject: async ({ params, locals, request }) => {
		if (!locals.user || locals.user.rank < 2) return fail(403, { message: 'Unauthorized' })
		const projectId = Number(params.projectID)

		const project = await db.query.project.findFirst({ where: eq(table.project.id, projectId) })
		if (!project) return fail(404, { message: 'Project not found' })

		await db
			.update(table.project)
			.set({ status: 'shared', moderatorNote: null })
			.where(eq(table.project.id, projectId))

		await db.insert(table.auditLog).values({
			action: 'unban_project',
			actorId: locals.user.id,
			targetId: projectId,
			targetType: 'project',
		})

		return { success: true }
	},

	addModNoteToProject: async ({ params, locals, request }) => {
		if (!locals.user || locals.user.rank < 2) return fail(403, { message: 'Unauthorized' })
		const projectId = Number(params.projectID)

		const project = await db.query.project.findFirst({ where: eq(table.project.id, projectId) })
		if (!project) return fail(404, { message: 'Project not found' })

		const formData = await request.formData()
		const note = formData.get('note')?.toString() ?? ''

		await db
			.update(table.project)
			.set({ moderatorNote: note })
			.where(eq(table.project.id, projectId))

		await db.insert(table.auditLog).values({
			action: 'add_mod_note_to_project',
			actorId: locals.user.id,
			targetId: projectId,
			targetType: 'project',
			extra: { note },
		})

		return { success: true }
	},
}
