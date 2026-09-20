import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { CATEGORIES } from '$lib/categories'
import { valkey } from '$lib/server/valkey'

export const load: PageServerLoad = async (event) => {
	const userId = event.locals.user?.id

	const keys = Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>
	const randomCategoryKey = keys[Math.floor(Math.random() * keys.length)]
	const selectedCategory = CATEGORIES[randomCategoryKey]

	const projectSelection = {
		id: table.project.id,
		title: table.project.title,
		image: table.project.image,
		createdAt: table.project.createdAt,
		author: {
			username: table.user.username,
			hasPFP: table.user.hasPFP,
		},
	}

	const fetchLatest = async () => {
		const key = 'projects:latest'
		const cached = await valkey.get(key)
		if (cached) return JSON.parse(cached)

		const res = await db
			.select(projectSelection)
			.from(table.project)
			.leftJoin(table.user, eq(table.project.userId, table.user.id))
			.where(eq(table.project.status, 'shared'))
			.orderBy(desc(table.project.createdAt))
			.limit(15)

		await valkey.set(key, JSON.stringify(res), 'EX', 120)
		return res
	}

	const fetchCategory = async () => {
		const key = `projects:category:${randomCategoryKey}`
		const cached = await valkey.get(key)
		if (cached) return JSON.parse(cached)

		// Query the search index using websearch_to_tsquery for the category tag
		const res = await db
			.select(projectSelection)
			.from(table.project)
			.leftJoin(table.user, eq(table.project.userId, table.user.id))
			.where(
				and(
					eq(table.project.status, 'shared'),
					sql`${table.project.searchIndex} @@ websearch_to_tsquery('english', ${selectedCategory.tag})`,
				),
			)
			.orderBy(sql`RANDOM()`)
			.limit(15)

		await valkey.set(key, JSON.stringify(res), 'EX', 300)
		return res
	}

	const fetchFeatured = async () => {
		const key = 'projects:featured'
		const cached = await valkey.get(key)
		if (cached) return JSON.parse(cached)

		const res = await db
			.select(projectSelection)
			.from(table.featuredProject)
			.innerJoin(table.project, eq(table.featuredProject.projectId, table.project.id))
			.leftJoin(table.user, eq(table.project.userId, table.user.id))
			.where(eq(table.project.status, 'shared'))
			.orderBy(desc(table.project.createdAt))
			.limit(15)

		await valkey.set(key, JSON.stringify(res), 'EX', 600)
		return res
	}

	const fetchFollowing = async () => {
		if (!userId) return []
		const key = `user:following_feed:${userId}`
		const cached = await valkey.get(key)
		if (cached) return JSON.parse(cached)

		const res = await db
			.select(projectSelection)
			.from(table.project)
			.innerJoin(table.follow, eq(table.project.userId, table.follow.followingId))
			.leftJoin(table.user, eq(table.project.userId, table.user.id))
			.where(and(eq(table.follow.followerId, userId), eq(table.project.status, 'shared')))
			.orderBy(desc(table.project.createdAt))
			.limit(15)

		await valkey.set(key, JSON.stringify(res), 'EX', 120)
		return res
	}

	const [latestProjects, categoryProjects, featuredProjects, followedProjects] = await Promise.all([
		fetchLatest(),
		fetchCategory(),
		fetchFeatured(),
		fetchFollowing(),
	])

	return {
		latestProjects,
		featuredProjects,
		followedProjects: followedProjects.length > 0 ? followedProjects : null,
		categorySection: {
			title: selectedCategory.name,
			tag: selectedCategory.tag,
			projects: categoryProjects,
		},
		user: event.locals.user,
	}
}
