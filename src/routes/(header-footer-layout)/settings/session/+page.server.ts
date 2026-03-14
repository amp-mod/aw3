import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc } from 'drizzle-orm'
import { error, fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { invalidateSession, deleteSessionTokenCookie } from '$lib/server/auth'
import { sha256 } from '@oslojs/crypto/sha2'
import { encodeHexLowerCase } from '@oslojs/encoding'

export const load: PageServerLoad = async (event) => {
	event.depends('aw3:sessions')

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
		sessions: sessions
			.map((s, index) => ({
				...s,
				isCurrent: s.id === currentSession.id,
				sha256ofID: encodeHexLowerCase(sha256(new TextEncoder().encode(s.id))),
				id: undefined,
				index,
			}))
			.sort((a, b) => {
				if (a.isCurrent) return -1
				if (b.isCurrent) return 1
				return Number(b.expiresAt) - Number(a.expiresAt)
			}),
	}
}

export const actions: Actions = {
	revoke: async (event) => {
		const { user, session: currentSession } = event.locals
		if (!user || !currentSession) throw error(401)

		const formData = await event.request.formData()
		const targetHash = formData.get('sha256ofID')

		if (typeof targetHash !== 'string') {
			return fail(400, { message: 'Invalid session hash' })
		}

		const userSessions = await db
			.select()
			.from(table.session)
			.where(eq(table.session.userId, user.id))

		const sessionToRevoke = userSessions.find((s) => {
			const hash = encodeHexLowerCase(sha256(new TextEncoder().encode(s.id)))
			return hash === targetHash
		})

		if (!sessionToRevoke) {
			return fail(404, { message: 'Session not found' })
		}

		await invalidateSession(sessionToRevoke.id)

		if (sessionToRevoke.id === currentSession.id) {
			deleteSessionTokenCookie(event)
			throw redirect(302, '/auth/login')
		}

		return { success: true }
	},
	revokeAll: async (event) => {
		const { user, session: currentSession } = event.locals
		if (!user || !currentSession) throw error(401)

		await db.delete(table.session)

		return { success: true }
	},
}
