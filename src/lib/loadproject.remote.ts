import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { getRequestEvent, query } from '$app/server'
import * as v from 'valibot'

export const getProject = query(v.number(), async (projectId: number) => {
	const result = await db.query.project.findFirst({
		where: eq(table.project.id, projectId),
		columns: {
			json: true,
			status: true,
			userId: true,
			title: true,
		},
	})

	if (!result) {
		return { error: 'Project not found' }
	}

	const locals = getRequestEvent().locals
	if (
		result.status !== 'shared' &&
		result.userId !== locals.user?.id &&
		(locals.user?.rank ?? 0) < 2
	) {
		return { error: 'Project not found' }
	}

	return result ?? null
})
