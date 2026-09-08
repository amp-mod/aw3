import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { getRequestEvent, query } from '$app/server'
import * as v from 'valibot'

export const getProjectJson = query(v.number(), async (projectId) => {
	const result = await db.query.project.findFirst({
		where: eq(table.project.id, projectId),
		columns: {
			json: true,
			status: true,
			userId: true,
		},
	})

	if (!result) {
		return null
	}

	const locals = getRequestEvent().locals
	if (
		result.status !== 'shared' &&
		result.userId !== locals.user?.id &&
		(locals.user?.rank ?? 0) < 2
	) {
		return null
	}

	return result?.json ?? null
})
