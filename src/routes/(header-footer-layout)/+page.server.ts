import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { CATEGORIES } from '$lib/categories'

export const load: PageServerLoad = async (event) => {
	const userId = event.locals.user?.id

	// 1. Pick the primary random category
	const keys = Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>
	const randomTitle = keys[Math.floor(Math.random() * keys.length)]
	const randomTag = CATEGORIES[randomTitle]

	// 2. Define the allowed logic mapping
	const getAllowedTags = (title: string): string[] => {
		const t = CATEGORIES
		switch (title) {
			case 'Game':
				return [t.Game, t['3D'], t.Platformer]
			case 'Contest':
				return Object.values(t) // Anything goes
			case 'Story':
				return [t.Story, t.Art, t.Animation, t.Game]
			case 'Online':
			case '3D':
				// Anything except music
				return Object.values(t).filter((v) => v !== t.Music)
			default:
				// Default behavior: strictly only show this tag
				return [t[title as keyof typeof CATEGORIES]]
		}
	}

	const allowedTags = getAllowedTags(randomTitle)

	// 3. Identify "Forbidden" tags for this specific selection
	// These are any tags in our system that are NOT in the allowed list
	const forbiddenTags = Object.values(CATEGORIES).filter((tag) => !allowedTags.includes(tag))

	// 4. Prepare SQL Regex patterns
	const primaryPattern = `(?<![a-zA-Z0-9])${randomTag}(?![a-zA-Z0-9])`

	// Join forbidden tags into a single regex: (#music|#tutorial|...)
	const forbiddenPattern =
		forbiddenTags.length > 0
			? forbiddenTags.map((tag) => tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
			: null

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

	const queries = {
		latest: db
			.select(projectSelection)
			.from(table.project)
			.leftJoin(table.user, eq(table.project.userId, table.user.id))
			.where(eq(table.project.hidden, false))
			.orderBy(desc(table.project.createdAt))
			.limit(12),

		category: db
			.select(projectSelection)
			.from(table.project)
			.leftJoin(table.user, eq(table.project.userId, table.user.id))
			.where(
				sql`
        ${table.project.hidden} = false
        -- 1. Must contain the random tag
        AND coalesce(${table.project.notes}, '') ~* ${primaryPattern}
        
        -- 2. Must NOT contain any forbidden tags
        ${
					forbiddenPattern
						? sql`AND NOT (coalesce(${table.project.notes}, '') ~* ${forbiddenPattern})`
						: sql``
				}
            
        -- 3. The random tag itself must only appear ONCE
        AND (
            SELECT count(*) 
            FROM regexp_matches(coalesce(${table.project.notes}, ''), ${primaryPattern}, 'gi')
        ) = 1
    `,
			),

		featuredProjects: db
			.select(projectSelection)
			.from(table.featuredProject)
			.innerJoin(table.project, eq(table.featuredProject.projectId, table.project.id))
			.leftJoin(table.user, eq(table.project.userId, table.user.id))
			.limit(12),

		following: userId
			? db
					.select(projectSelection)
					.from(table.project)
					.innerJoin(table.follow, eq(table.project.userId, table.follow.followingId))
					.leftJoin(table.user, eq(table.project.userId, table.user.id))
					.where(eq(table.follow.followerId, userId))
					.orderBy(desc(table.project.createdAt))
					.limit(12)
			: Promise.resolve([]),
	}

	const [latestProjects, categoryProjects, featuredProjects, followedProjects] = await Promise.all([
		queries.latest,
		queries.category,
		queries.featuredProjects,
		queries.following,
	])

	return {
		latestProjects,
		featuredProjects,
		followedProjects: followedProjects.length > 0 ? followedProjects : null,
		categorySection: {
			title: randomTitle,
			projects: categoryProjects,
		},
	}
}
