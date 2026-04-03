import { json, error } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { username } = params

	// 1. Get the user ID from the username
	const [user] = await db
		.select({ id: table.user.id })
		.from(table.user)
		.where(eq(table.user.username, username))
		.limit(1)

	if (!user) throw error(404, 'User not found')

	// 2. Parse pagination
	const limit = Math.min(Number(url.searchParams.get('limit')) || 10, 20)
	const offset = Number(url.searchParams.get('offset')) || 0

	try {
		const projects = await db
			.select({
				id: table.project.id,
				title: table.project.title,
			})
			.from(table.project)
			.where(eq(table.project.userId, user.id))
			.orderBy(desc(table.project.createdAt))
			.limit(limit)
			.offset(offset)

		return json(projects)
	} catch (e) {
		throw error(500, 'Database error')
	}
}
