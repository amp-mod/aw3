import { json, error } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, and, desc, lt } from 'drizzle-orm'

export const GET = async ({ url, locals }) => {
	if (!locals.user) error(401)

	const cursor = url.searchParams.get('cursor')
	const limit = 15

	const notifications = await db.query.notification.findMany({
		where: and(
			eq(table.notification.recipientId, locals.user.id),
			cursor ? lt(table.notification.id, Number(cursor)) : undefined,
		),
		orderBy: [desc(table.notification.id)],
		limit: limit + 1,
		with: {
			issuer: { columns: { id: true, username: true, hasPFP: true } },
		},
	})

	const hasNextPage = notifications.length > limit
	const items = hasNextPage ? notifications.slice(0, -1) : notifications
	const nextCursor = hasNextPage ? items[items.length - 1].id : null

	return json({ items, nextCursor })
}
