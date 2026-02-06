import { sequence } from '@sveltejs/kit/hooks'
import * as auth from '$lib/server/auth'
import { error, redirect, type Handle } from '@sveltejs/kit'
import { paraglideMiddleware } from '$lib/paraglide/server'

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
		})
	})

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName)

	if (!sessionToken) {
		event.locals.user = null
		event.locals.session = null
		return resolve(event)
	}

	const { session, user } = await auth.validateSessionToken(sessionToken)

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt)
	} else {
		auth.deleteSessionTokenCookie(event)
	}

	event.locals.user = user
	event.locals.session = session
	return resolve(event)
}

const handleGuard: Handle = async ({ event, resolve }) => {
	const isAdminRoute = event.route.id?.startsWith('/(protected)/')

	if (isAdminRoute) {
		if (!event.locals.user || (event.locals.user.rank !== 3 && !process.env.AW3_FORCE_ADMIN)) {
			throw error(403, 'This is a protected page, only operators can access it.')
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

export const handle: Handle = sequence(handleAuth, handleBanned, handleGuard, handleParaglide)
