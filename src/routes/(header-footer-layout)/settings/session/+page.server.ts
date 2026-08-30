import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { error, fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { invalidateSession, deleteSessionTokenCookie } from '$lib/server/auth'
import { sha256 } from '@oslojs/crypto/sha2'
import { encodeHexLowerCase } from '@oslojs/encoding'
import geoip from 'geoip-lite'
import { getLocale } from '$lib/paraglide/runtime'

export const load: PageServerLoad = async (event) => {
	event.depends('aw3:sessions')

	const user = event.locals.user
	const currentSession = event.locals.session

	if (!user || !currentSession) return {}

	// 1. Setup Localization for Country Names
	const locale = getLocale()
	let countryNames: Intl.DisplayNames
	try {
		countryNames = new Intl.DisplayNames([locale, 'en'], { type: 'region' })
	} catch {
		countryNames = new Intl.DisplayNames(['en'], { type: 'region' })
	}

	const sessions = await db
		.select()
		.from(table.session)
		.where(eq(table.session.userId, user.id))
		.orderBy(desc(table.session.expiresAt))

	return {
		user,
		sessions: sessions
			.map((s, index) => {
				// 2. Geolocation Lookup
				const geo = geoip.lookup(s.ip || '')
				let location = 'Unknown Location'

				if (s.ip === '127.0.0.1' || s.ip === '::1') {
					location = 'Localhost'
				} else if (geo) {
					try {
						const countryFull = geo.country ? countryNames.of(geo.country) : ''
						location = [geo.city, countryFull].filter(Boolean).join(', ')
					} catch {
						location = [geo.city, geo.country].filter(Boolean).join(', ')
					}
				}

				return {
					...s,
					location,
					isCurrent: s.id === currentSession.id,
					index,
				}
			})
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
		const targetID = formData.get('id') as string

		// Find the actual session ID by re-hashing user sessions
		const [sessionToRevoke] = await db
			.select()
			.from(table.session)
			.where(eq(table.session.id, targetID))

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

		// Delete all sessions for this user EXCEPT the current one (optional)
		// Or delete all if you want to force a full logout
		await db.delete(table.session).where(eq(table.session.userId, user.id))

		deleteSessionTokenCookie(event)
		throw redirect(302, '/auth/login')
	},
}
