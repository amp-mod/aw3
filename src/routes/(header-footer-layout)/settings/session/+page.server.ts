import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc } from 'drizzle-orm'
import { error, fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { invalidateSession, deleteSessionTokenCookie } from '$lib/server/auth'

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user
	const currentSession = event.locals.session

	if (!user || !currentSession) {
		return {}
	}

	const sessions = await db
		.select()
		.from(table.session)
		.where(eq(table.session.userId, user.id))
		.orderBy(desc(table.session.expiresAt))

	return {
		user,
		sessions: sessions.map((s, index) => ({
			...s,
			isCurrent: s.id === currentSession.id,
			id: undefined,
			index,
		})).sort((s, t) => +s.expiresAt - +t.expiresAt),
	}
}

export const actions: Actions = {
	revoke: async (event) => {
		const { user, session: currentSession } = event.locals
		if (!user || !currentSession) throw error(401)

		const formData = await event.request.formData()
		const targetIndex = Number(formData.get('index'))

		if (isNaN(targetIndex)) {
			return fail(400, { message: 'Invalid index' })
		}

		const userSessions = await db
			.select()
			.from(table.session)
			.where(eq(table.session.userId, user.id))
			.orderBy(desc(table.session.expiresAt))

		const targetSession = userSessions[targetIndex]

		if (!targetSession) {
			return fail(404, { message: 'Session no longer exists' })
		}

		await invalidateSession(targetSession.id)

		if (targetSession.id === currentSession.id) {
			deleteSessionTokenCookie(event)
			throw redirect(302, '/')
		}

		return { success: true }
	},
}
