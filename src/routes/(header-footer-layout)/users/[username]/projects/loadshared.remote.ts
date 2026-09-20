import { query, getRequestEvent } from '$app/server'
import * as v from 'valibot'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc, and, ilike } from 'drizzle-orm'
export const getProjects = query(
	v.object({
		page: v.number(),
		userID: v.number(),
		search: v.optional(v.string()),
	}),
	async ({ page, userID, search }) => {
		const limit = 20
		const offset = (page - 1) * limit

		// Prepare the base conditions
		const filters = [eq(table.project.userId, userID), eq(table.project.status, 'shared')]

		// Add search filter if a search string is provided
		if (search && search.trim() !== '') {
			filters.push(ilike(table.project.title, `%${search}%`))
		}

		return await db
			.select({
				id: table.project.id,
				title: table.project.title,
				image: table.project.image,
			})
			.from(table.project)
			.where(and(...filters)) // Spread the array of conditions
			.orderBy(desc(table.project.createdAt))
			.limit(limit)
			.offset(offset)
	},
)
