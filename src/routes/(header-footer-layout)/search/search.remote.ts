import { query, getRequestEvent } from '$app/server'
import * as v from 'valibot'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc, and, or, sql } from 'drizzle-orm'

export const search = query(
	v.object({
		page: v.number(),
		search: v.string(),
	}),
	async ({ page, search: rawSearch }) => {
		// 1. Sanitize and Validate
		const trimmedSearch = rawSearch.trim()

		// Return empty array if search is empty or just punctuation/wildcards
		// This regex checks if there's at least one alphanumeric character
		if (trimmedSearch.length < 2 || !/[a-zA-Z0-9]/.test(trimmedSearch)) {
			return []
		}

		const limit = 50
		const offset = (page - 1) * limit

		// 2. Define Visibility
		const visibilityFilter = eq(table.project.status, 'shared')

		// 3. Define Full-Text Search Filter
		const searchFilter = sql`${table.project.searchIndex} @@ websearch_to_tsquery('english', ${trimmedSearch})`

		return await db
			.select({
				id: table.project.id,
				title: table.project.title,
				createdAt: table.project.createdAt,
				status: table.project.status,
				userId: table.project.userId,
				rank: sql<number>`ts_rank(${table.project.searchIndex}, websearch_to_tsquery('english', ${trimmedSearch}))`.as(
					'rank',
				),
			})
			.from(table.project)
			.where(and(visibilityFilter, searchFilter))
			.orderBy(desc(sql`rank`))
			.limit(limit)
			.offset(offset)
	},
)
