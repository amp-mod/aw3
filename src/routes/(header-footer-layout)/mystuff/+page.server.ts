import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { error, fail } from '@sveltejs/kit'
import { and, eq, inArray } from 'drizzle-orm'
import type { PageServerLoad, Actions } from './$types'
import { failIfCannotPerformAction } from '$lib/server/permissions'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized')
	}

	// Fetch projects owned by the user
	const userProjects = await db.query.project.findMany({
		where: eq(table.project.userId, locals.user.id),
		columns: {
			id: true,
			title: true,
			notes: true,
			image: true,
			status: true,
			createdAt: true,
			updatedAt: true,
		},
		orderBy: (project, { desc }) => [desc(project.updatedAt)],
	})

	return {
		projects: userProjects,
	}
}

export const actions: Actions = {
	shareProject: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' })
		failIfCannotPerformAction(locals.user, 'shareProject')

		const formData = await request.formData()
		const projectId = Number(formData.get('projectId'))

		if (isNaN(projectId)) {
			return fail(400, { message: 'Invalid project ID' })
		}

		const project = await db.query.project.findFirst({
			where: eq(table.project.id, projectId),
		})

		if (!project) return fail(404, { message: 'Project not found' })

		// Ensure user owns the project or is an admin
		if (project.userId !== locals.user.id && locals.user.rank < 2) {
			return fail(403, { message: 'Forbidden' })
		}

		if (project.status === 'banned') {
			return fail(403, { message: 'Cannot share a banned project' })
		}

		await db
			.update(table.project)
			.set({ status: 'shared', updatedAt: new Date() })
			.where(eq(table.project.id, projectId))

		await db.insert(table.auditLog).values({
			action: 'share_project',
			actorId: locals.user.id,
			targetId: projectId,
			targetType: 'project',
		})

		return { success: true }
	},

	unshareProject: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' })
		failIfCannotPerformAction(locals.user, 'shareProject')

		const formData = await request.formData()
		const projectId = Number(formData.get('projectId'))

		if (isNaN(projectId)) {
			return fail(400, { message: 'Invalid project ID' })
		}

		const project = await db.query.project.findFirst({
			where: eq(table.project.id, projectId),
		})

		if (!project) return fail(404, { message: 'Project not found' })

		// Ensure user owns the project or is an admin
		if (project.userId !== locals.user.id && locals.user.rank < 2) {
			return fail(403, { message: 'Forbidden' })
		}

		if (project.status === 'banned') {
			return fail(403, { message: 'Cannot unshare a banned project' })
		}

		await db
			.update(table.project)
			.set({ status: 'unshared', updatedAt: new Date() })
			.where(eq(table.project.id, projectId))

		await db.insert(table.auditLog).values({
			action: 'unshare_project',
			actorId: locals.user.id,
			targetId: projectId,
			targetType: 'project',
		})

		return { success: true }
	},

	toggleShareStatus: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' })
		failIfCannotPerformAction(locals.user, 'shareProject')

		const formData = await request.formData()
		const projectId = Number(formData.get('projectId'))

		if (isNaN(projectId)) {
			return fail(400, { message: 'Invalid project ID' })
		}

		const project = await db.query.project.findFirst({
			where: eq(table.project.id, projectId),
		})

		if (!project) return fail(404, { message: 'Project not found' })

		if (project.userId !== locals.user.id && locals.user.rank < 2) {
			return fail(403, { message: 'Forbidden' })
		}

		if (project.status === 'banned') {
			return fail(403, { message: 'Cannot change share status of a banned project' })
		}

		const newStatus = project.status === 'shared' ? 'unshared' : 'shared'

		await db
			.update(table.project)
			.set({ status: newStatus, updatedAt: new Date() })
			.where(eq(table.project.id, projectId))

		await db.insert(table.auditLog).values({
			action: newStatus === 'shared' ? 'share_project' : 'unshare_project',
			actorId: locals.user.id,
			targetId: projectId,
			targetType: 'project',
		})

		return { success: true, newStatus }
	},
}
