import { query } from '$app/server'
import * as v from 'valibot'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'

export const getFeaturedProjects = query(v.number(), async (page) => {
	const limit = 20
	const offset = (page - 1) * limit

	return await db
		.select({
			id: table.project.id,
			title: table.project.title,
			image: table.project.image,
			createdAt: table.project.createdAt,
			author: { username: table.user.username, hasPFP: table.user.hasPFP },
		})
		.from(table.featuredProject)
		.innerJoin(table.project, eq(table.featuredProject.projectId, table.project.id))
		.leftJoin(table.user, eq(table.project.userId, table.user.id))
		.limit(limit)
		.offset(offset)
})
