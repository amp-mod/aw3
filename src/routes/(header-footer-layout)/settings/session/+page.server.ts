import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc } from 'drizzle-orm'
import { error, redirect } from '@sveltejs/kit'
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
		sessions: sessions.map((s) => ({
			...s,
			isCurrent: s.id === currentSession.id,
			id: undefined,
		})),
	}
}

export const actions: Actions = {
	revoke: async (event) => {
		const user = event.locals.user
		if (!user) throw error(401)

		const formData = await event.request.formData()
		const sessionId = formData.get('sessionId') as string

		if (!sessionId) return { success: false }

		const [sessionToId] = await db
			.select()
			.from(table.session)
			.where(eq(table.session.id, sessionId))

		if (sessionToId && sessionToId.userId === user.id) {
			await invalidateSession(sessionId)

			if (sessionId === event.locals.session?.id) {
				deleteSessionTokenCookie(event)
				throw redirect(302, '/')
			}
		}

		return { success: true }
	},
}
