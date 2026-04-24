import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { query } from '$app/server'
import * as v from 'valibot'

export const getProjectJson = query(v.number(), async (projectId) => {
	console.log('load')
	const result = await db.query.project.findFirst({
		where: eq(table.project.id, projectId),
		columns: {
			json: true,
		},
	})

	return result?.json ?? null
})
