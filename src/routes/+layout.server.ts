import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import bannedPermittedPaths from '$lib/banned-permitted-paths'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, and, count } from 'drizzle-orm'

export const load: LayoutServerLoad = async ({ locals, url, depends }) => {
	depends('aw3:sessions')
	const { user, sessionDeleted } = locals

	const isPermittedPath = bannedPermittedPaths.includes(url.pathname)

	if (user?.status === 'banned' && !isPermittedPath) {
		throw redirect(307, '/banned')
	}

	let unreadNotificationsCount = 0

	if (user) {
		const [result] = await db
			.select({ value: count() })
			.from(table.notification)
			.where(and(eq(table.notification.recipientId, user.id), eq(table.notification.isRead, false)))
		unreadNotificationsCount = result.value
	}

	return {
		user,
		unreadNotificationsCount,
		isDangerousMode: process.env.AW3_FORCE_ADMIN === 'true',
		sessionDeleted,
	}
}
