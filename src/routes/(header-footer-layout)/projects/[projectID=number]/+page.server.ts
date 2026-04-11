import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { error, fail } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const projectId = Number(params.projectID)

	if (isNaN(projectId)) {
		throw error(400, 'Invalid Project ID')
	}

	const project = await db.query.project.findFirst({
		where: eq(table.project.id, projectId),
	})

	if (!project) {
		throw error(404, { message: 'Project not found' })
	}

	const author = await db.query.user.findFirst({
		where: eq(table.user.id, project.userId),
	})

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
}
