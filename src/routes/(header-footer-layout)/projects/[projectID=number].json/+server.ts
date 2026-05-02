import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { json, error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, locals }) => {
	const projectId = Number(params.projectID)

	if (isNaN(projectId)) {
		throw error(400, 'Invalid Project ID')
	}

	const project = await db.query.project.findFirst({
		where: eq(table.project.id, projectId),
		columns: {
			json: true,
			status: true,
			userId: true,
		},
	})

	if (!project) {
		throw error(404, 'Project not found')
	}

	if (project.status !== 'shared') {
		const isOwner = locals.user?.id === project.userId
		const isAdmin = (locals.user?.rank ?? 0) >= 2

		if (!isOwner && !isAdmin) {
			throw error(
				403,
				'Forbidden. This may be because the project is unshared, or has been banned.',
			)
		}
	}

	return json(project.json)
}
