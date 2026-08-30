import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from '../$types'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { storage } from '$lib/storage'
import { failIfCannotPerformAction } from '$lib/server/permissions'

export const POST: RequestHandler = async ({ request, locals, params, url }) => {
	failIfCannotPerformAction(locals.user, 'createProject')

	const { session, user } = locals
	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	const projectId = params.projectID
	const assetName = params.assetName

	if (!projectId || !assetName) {
		throw error(400, 'Missing project ID or asset name query parameter')
	}

	// Verify project ownership
	const project = await db.query.project.findFirst({
		where: eq(table.project.id, projectId),
		columns: { userId: true },
	})

	if (!project || project.userId !== user.id) {
		throw error(403, 'Unauthorized to modify this project')
	}

	try {
		// Read raw binary stream directly from request body for optimal performance
		const arrayBuffer = await request.arrayBuffer()
		if (arrayBuffer.byteLength === 0) {
			throw error(400, 'Empty asset body')
		}

		const buffer = Buffer.from(arrayBuffer)
		await storage.write(`projects/${projectId}/${assetName}`, buffer)

		return json({ success: true })
	} catch (e: any) {
		if (e?.status) throw e
		console.error(e)
		throw error(500, 'Failed to upload asset')
	}
}
