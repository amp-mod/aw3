import { query, getRequestEvent } from '$app/server'
import * as v from 'valibot'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc, and, ne } from 'drizzle-orm'

// Define the allowed status types
type ProjectType = 'shared' | 'unshared'

export const getMyProjects = query(
	// Validate the single argument as an object
	v.object({
		page: v.number(),
		type: v.picklist(['shared', 'unshared'] as const),
	}),
	async ({ page, type }) => {
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

		// Note: type is narrowed to 'shared' | 'unshared' by Valibot
		const statusCondition = typeConditions[type as ProjectType]

		return await db
			.select({
				id: table.project.id,
				title: table.project.title,
				image: table.project.image,
				createdAt: table.project.createdAt,
				status: table.project.status,
			})
			.from(table.project)
			.where(and(eq(table.project.userId, locals.user.id), statusCondition))
			.orderBy(desc(table.project.createdAt))
			.limit(limit)
			.offset(offset)
	},
)
