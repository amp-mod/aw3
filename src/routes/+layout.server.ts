import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import bannedPermittedPaths from '$lib/banned-permitted-paths'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'
import { canPerformAction } from '$lib/server/permissions'

export const load: LayoutServerLoad = async ({ locals, url, cookies, depends }) => {
	depends('aw3:sessions')
	const { user, sessionDeleted } = locals
	const isPermittedPath = bannedPermittedPaths.includes(url.pathname)

	if (
		!user &&
		cookies.get('s_reg_token') &&
		url.pathname !== '/auth/register' &&
		!isPermittedPath
	) {
		throw redirect(307, '/auth/register')
	}

	if (user?.status === 'banned' && !isPermittedPath) {
		throw redirect(307, '/banned')
	}

	let unreadNotificationsCount = 0
	let canRankUp = false

	if (user) {
		const [result] = await db
			.select({ value: count() })
			.from(table.notification)
			.where(and(eq(table.notification.recipientId, user.id), eq(table.notification.isRead, false)))
		unreadNotificationsCount = result.value

		const viewerRank = user.rank ?? 0
		if (viewerRank === 0 && canPerformAction(viewerRank, 'rankUp')) {
			const projectCountResult = await db
				.select({ count: sql<number>`count(*)` })
				.from(table.project)
				.where(and(eq(table.project.userId, user.id), eq(table.project.status, 'shared')))
			const projectCount = Number(projectCountResult[0]?.count ?? 0)
			const accountAgeDays =
				(Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)

			if (accountAgeDays >= 5 && projectCount >= 2) {
				canRankUp = true
			}
		}
	}

	const accentColour = user?.accentColour || '#4fa55c'
	return {
		user,
		accentColour,
		unreadNotificationsCount,
		sessionDeleted,
		canRankUp,
	}
}
