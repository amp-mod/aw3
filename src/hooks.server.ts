import { sequence } from '@sveltejs/kit/hooks'
import * as auth from '$lib/server/auth'
import { error, redirect, type Handle } from '@sveltejs/kit'
import {
	setLocale,
	baseLocale,
	extractLocaleFromHeader,
	isLocale,
	cookieName as langCookieName,
} from '$lib/paraglide/runtime'
import { m } from '$lib/paraglide/messages'

const handleParaglide: Handle = async ({ event, resolve }) => {
	const cookieLang = event.cookies.get(langCookieName)
	const headerLang = extractLocaleFromHeader(event.request)

	const finalLang = isLocale(cookieLang)
		? cookieLang
		: isLocale(headerLang)
			? headerLang
			: baseLocale

	setLocale(finalLang)

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', finalLang),
	})
}

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName)?.split('..')[1]

	if (!sessionToken) {
		event.locals.user = null
		event.locals.session = null
		return resolve(event)
	}

	const { session, user } = await auth.validateSessionToken(sessionToken)

	if (session) {
		const currentIp = event.getClientAddress()
		const currentUserAgent = event.request.headers.get('user-agent')

		if (session.ip !== currentIp && session.userAgent !== currentUserAgent) {
			// If this happens, it is almost certainly a session hijack.
			// Better to just shut it down.
			auth.invalidateSession(session.id)
			auth.deleteSessionTokenCookie(event)
			throw redirect(307, '/sessionpwned')
		}
		if (session.ip !== currentIp || session.userAgent !== currentUserAgent) {
			await auth.updateSessionDetails(session.id, {
				ip: currentIp,
				userAgent: currentUserAgent ?? '???',
			})
		}

		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt)
	} else {
		event.locals.sessionDeleted = true
		auth.deleteSessionTokenCookie(event)
	}

	event.locals.user = user
	event.locals.session = session
	return resolve(event)
}

export const handleGuard: Handle = async ({ event, resolve }) => {
	const isAdminRoute = event.route.id?.startsWith('/(protected)/')
	const isNotGet = event.request.method !== 'GET'

	if (isAdminRoute && isNotGet) {
		const hasRank = event.locals.user?.rank === 3
		const isForced = process.env.AW3_FORCE_ADMIN === 'true' || process.env.AW3_FORCE_ADMIN === '1'

		if (!event.locals.user || (!hasRank && !isForced)) {
			throw error(404, 'Not Found')
		}
	}

	return resolve(event)
}
const handleBanned: Handle = async ({ event, resolve }) => {
	const user = event.locals.user
	const isBannedPage = event.url.pathname === '/banned'
	const isLogoutAction = event.url.pathname === '/auth/logout'

	if (user?.status === 'banned' && !isBannedPage && !isLogoutAction) {
		throw redirect(307, '/banned')
	}

	if (user?.status !== 'banned' && isBannedPage) {
		throw redirect(307, '/')
	}

	return resolve(event)
}

export const handle: Handle = sequence(handleParaglide, handleAuth, handleBanned, handleGuard)
