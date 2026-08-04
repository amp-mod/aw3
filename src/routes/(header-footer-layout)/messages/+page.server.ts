import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { error } from '@sveltejs/kit'
import { eq, and, desc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	// 1. Guard
	if (!locals.user) {
		error(401, 'Unauthorized')
	}

	// 3. Fetch initial batch
	const limit = 15
	const notifications = await db.query.notification.findMany({
		where: eq(table.notification.recipientId, locals.user.id),
		orderBy: [desc(table.notification.id)],
		limit: limit + 1,
		with: {
			issuer: {
				columns: { id: true, username: true, hasPFP: true },
			},
		},
	})

	// 2. Mark all as read for this user immediately on load
	await db
		.update(table.notification)
		.set({ isRead: true })
		.where(
			and(eq(table.notification.recipientId, locals.user.id), eq(table.notification.isRead, false)),
		)

	const hasNextPage = notifications.length > limit
	const items = hasNextPage ? notifications.slice(0, -1) : notifications
	const nextCursor = hasNextPage ? items[items.length - 1].id : null

	return {
		notifications: items,
		nextCursor,
	}
}
