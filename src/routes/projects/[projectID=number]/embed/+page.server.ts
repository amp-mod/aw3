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

	return {
		project,
	}
}
