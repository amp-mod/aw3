import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq, or, and } from 'drizzle-orm'
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

	return {
		project,
		author: {
			username: author?.username ?? 'Unknown User',
			id: author?.id,
		},
	}
}

export const actions: Actions = {
	renameProject: async ({ request, params, locals }) => {
		// 1. Session Check
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		const projectId = Number(params.projectID)
		const formData = await request.formData()
		const newTitle = formData.get('title')?.toString()

		// 2. Validation
		if (!newTitle || newTitle.length < 1) {
			return fail(400, { message: 'Title is required' })
		}

		if (newTitle.length > 100) {
			return fail(400, { message: 'Title is too long' })
		}

		// 3. Fetch project to check ownership
		const project = await db.query.project.findFirst({
			where: eq(table.project.id, projectId),
		})

		if (!project) {
			return fail(404, { message: 'Project not found' })
		}

		// 4. Authorization Logic
		const isOwner = project.userId === locals.user.id
		const isAdmin = locals.user.rank >= 2

		if (!isOwner && !isAdmin) {
			return fail(403, { message: 'You do not have permission to rename this project' })
		}

		// 5. Update
		await db.update(table.project).set({ title: newTitle }).where(eq(table.project.id, projectId))

		return { success: true }
	},
	editNotes: async ({ request, params, locals }) => {
		// 1. Session Check
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		const projectId = Number(params.projectID)
		const formData = await request.formData()
		const notes = formData.get('notes')?.toString()

		// 2. Validation
		if (notes.length > 10000) {
			return fail(400, { message: 'Notes are too long' })
		}

		// 3. Fetch project to check ownership
		const project = await db.query.project.findFirst({
			where: eq(table.project.id, projectId),
		})

		if (!project) {
			return fail(404, { message: 'Project not found' })
		}

		// 4. Authorization Logic
		const isOwner = project.userId === locals.user.id
		const isAdmin = locals.user.rank >= 2

		if (!isOwner && !isAdmin) {
			return fail(403, { message: 'You do not have permission to edit notes' })
		}

		// 5. Update
		await db.update(table.project).set({ notes }).where(eq(table.project.id, projectId))

		return { success: true }
	},
}
