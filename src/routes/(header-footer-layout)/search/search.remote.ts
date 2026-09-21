import { query, getRequestEvent } from '$app/server'
import * as v from 'valibot'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc, and, ilike, sql } from 'drizzle-orm'
import { stripMarkdown } from '$lib/markdown'

export const search = query(
	v.object({
		page: v.number(),
		search: v.string(),
	}),
	async ({ page, search: rawSearch }) => {
		// 1. Sanitize and Validate
		const trimmedSearch = rawSearch.trim()

		// Return empty results if search is empty or lacks alphanumeric characters
		if (trimmedSearch.length < 2 || !/[a-zA-Z0-9]/.test(trimmedSearch)) {
			return { projects: [], user: null }
		}

		const limit = 50
		const offset = (page - 1) * limit

		// 2. Define Visibility & Search Filters
		const visibilityFilter = eq(table.project.status, 'shared')
		const searchFilter = sql`${table.project.searchIndex} @@ websearch_to_tsquery('english', ${trimmedSearch})`

		// 3. Conditionally Fetch User on Page 1
		let matchingUser = null
		if (page === 1) {
			const [foundUser] = await db
				.select({
					id: table.user.id,
					username: table.user.username,
					hasPFP: table.user.hasPFP,
					bio: table.user.bio,
				})
				.from(table.user)
				.where(and(ilike(table.user.username, trimmedSearch), eq(table.user.isEmailVerified, true)))
				.limit(1)

			matchingUser = foundUser ?? null

			matchingUser.bio = stripMarkdown(matchingUser.bio).replaceAll('\n', ' ')
			if (matchingUser.bio.length > 100) {
				matchingUser.bio = matchingUser.bio.substring(0, 100) + '...'
			}
		}

		// 4. Fetch Projects
		const projects = await db
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

		return {
			user: matchingUser,
			projects,
		}
	},
)
