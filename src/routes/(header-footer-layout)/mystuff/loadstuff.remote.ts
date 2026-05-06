import { query, getRequestEvent } from '$app/server'
import * as v from 'valibot'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc, and, ne, ilike } from 'drizzle-orm'

type ProjectType = 'shared' | 'unshared'

export const getMyProjects = query(
	v.object({
		page: v.number(),
		type: v.picklist(['shared', 'unshared'] as const),
		search: v.optional(v.string()),
	}),
	async ({ page, type, search }) => {
		const { locals } = getRequestEvent()

		if (!locals.user) {
			throw new Error('Unauthorized')
		}

		const limit = 9
		const offset = (page - 1) * limit

		const typeConditions = {
			shared: eq(table.project.status, 'shared'),
			unshared: ne(table.project.status, 'shared'),
		}

		// Prepare the base conditions
		const filters = [eq(table.project.userId, locals.user.id), typeConditions[type as ProjectType]]

		// Add search filter if a search string is provided
		if (search && search.trim() !== '') {
			filters.push(ilike(table.project.title, `%${search}%`))
		}

		return await db
			.select({
				id: table.project.id,
				title: table.project.title,
				image: table.project.image,
				createdAt: table.project.createdAt,
				status: table.project.status,
			})
			.from(table.project)
			.where(and(...filters)) // Spread the array of conditions
			.orderBy(desc(table.project.createdAt))
			.limit(limit)
			.offset(offset)
	},
)
