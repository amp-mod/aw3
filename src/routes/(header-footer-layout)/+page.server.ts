import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { CATEGORIES } from '$lib/categories'
import sharp from 'sharp'

export const load: PageServerLoad = async (event) => {
	const userId = event.locals.user?.id

	// 1. Pick the primary random category
	const keys = Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>
	const randomTitle = keys[Math.floor(Math.random() * keys.length)]
	const randomTag = CATEGORIES[randomTitle]

	const getAllowedTags = (title: string): string[] => {
		const t = CATEGORIES
		switch (title) {
			case 'Game':
				return [t.Game, t['3D'], t.Platformer]
			case 'Contest':
				return Object.values(t)
			case 'Story':
				return [t.Story, t.Art, t.Animation, t.Game]
			case 'Online':
			case '3D':
				return Object.values(t).filter((v) => v !== t.Music)
			default:
				return [t[title as keyof typeof CATEGORIES]]
		}
	}

	const allowedTags = getAllowedTags(randomTitle)
	const forbiddenTags = Object.values(CATEGORIES).filter((tag) => !allowedTags.includes(tag))
	const primaryPattern = `(?<![a-zA-Z0-9])${randomTag}(?![a-zA-Z0-9])`
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

	const fetchBlogUpdates = async () => {
		try {
			const res = await fetch(
				'https://ampblog.flarum.cloud/api/discussions?filter%5Bq%5D=is%3Ablog&sort=-createdAt&include=user,tags',
			)

			if (!res.ok) return []
			const json = await res.json()

			const discussions = json.data || []
			const included = json.included || []

			return await Promise.all(
				discussions.map(async (discussion: any) => {
					const authorId = discussion.relationships?.user?.data?.id
					const authorData = included.find(
						(inc: any) => inc.type === 'users' && inc.id === authorId,
					)

					// Get Tag Info
					const tagRelation = discussion.relationships?.tags?.data?.[0]
					const tagData = included.find(
						(inc: any) => inc.type === 'tags' && inc.id === tagRelation?.id,
					)

					return {
						id: discussion.id,
						title: discussion.attributes.title,
						slug: discussion.attributes.slug,
						createdAt: discussion.attributes.createdAt,
						author: {
							username: authorData?.attributes.username ?? 'Newswriters',
						},
					}
				}),
			)
		} catch (e) {
			console.error('Flarum fetch error:', e)
			return []
		}
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
			.leftJoin(table.user, eq(table.project.userId, table.user.id)).where(sql`
                ${table.project.hidden} = false
                AND coalesce(${table.project.notes}, '') ~* ${primaryPattern}
                ${forbiddenPattern ? sql`AND NOT (coalesce(${table.project.notes}, '') ~* ${forbiddenPattern})` : sql``}
                AND (SELECT count(*) FROM regexp_matches(coalesce(${table.project.notes}, ''), ${primaryPattern}, 'gi')) = 1
            `),

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

		blog: fetchBlogUpdates(),
	}

	const [latestProjects, categoryProjects, featuredProjects, followedProjects, blogDiscussions] =
		await Promise.all([
			queries.latest,
			queries.category,
			queries.featuredProjects,
			queries.following,
			queries.blog,
		])

	return {
		latestProjects,
		featuredProjects,
		followedProjects: followedProjects.length > 0 ? followedProjects : null,
		categorySection: {
			title: randomTitle,
			projects: categoryProjects,
		},
		blogDiscussions,
		user: event.locals.user,
	}
}
