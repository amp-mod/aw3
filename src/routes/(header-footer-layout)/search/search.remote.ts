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
		const trimmedSearch = rawSearch.trim()

		if (trimmedSearch.length < 2 || !/[a-zA-Z0-9]/.test(trimmedSearch)) {
			return { projects: [], user: null }
		}

		const limit = 50
		const offset = (page - 1) * limit

		const visibilityFilter = eq(table.project.status, 'shared')
		const searchFilter = sql`${table.project.searchIndex} @@ websearch_to_tsquery('english', ${trimmedSearch})`

		let matchingUser = null
		if (page === 1) {
			const [foundUser] = await db
				.select({
					id: table.user.id,
					username: table.user.username,
					hasPFP: table.user.hasPFP,
					frame: table.user.frame,
					bio: table.user.bio,
				})
				.from(table.user)
				.where(and(ilike(table.user.username, trimmedSearch), eq(table.user.isEmailVerified, true)))
				.limit(1)

			matchingUser = foundUser ?? null

			if (matchingUser?.bio) {
				matchingUser.bio = stripMarkdown(matchingUser.bio).replaceAll('\n', ' ')
				if (matchingUser.bio.length > 100) {
					matchingUser.bio = matchingUser.bio.substring(0, 100) + '...'
				}
			}
		}

		const projects = await db
			.select({
				id: table.project.id,
				title: table.project.title,
				createdAt: table.project.createdAt,
				status: table.project.status,
				userId: table.project.userId,
				author: {
					id: table.user.id,
					username: table.user.username,
					hasPFP: table.user.hasPFP,
					frame: table.user.frame,
				},
				rank: sql<number>`ts_rank(${table.project.searchIndex}, websearch_to_tsquery('english', ${trimmedSearch}))`.as(
					'rank',
				),
			})
			.from(table.project)
			.leftJoin(table.user, eq(table.project.userId, table.user.id))
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
