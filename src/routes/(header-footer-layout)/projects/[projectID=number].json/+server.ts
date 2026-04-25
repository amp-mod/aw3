import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { json, error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
	const projectId = Number(params.projectID)

	if (isNaN(projectId)) {
		throw error(400, 'Invalid Project ID')
	}

	const project = await db.query.project.findFirst({
		where: eq(table.project.id, projectId),
		columns: {
			json: true,
		},
	})

	if (!project) {
		throw error(404, 'Project not found')
	}

	return json(project.json)
}
