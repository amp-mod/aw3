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
import bannedPermittedPaths from '$lib/banned-permitted-paths'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'

import maintenanceHtml from './maintenance.html?raw'

const isMaintenanceMode = true

const handleLocalhostConnection: Handle = async ({ event, resolve }) => {
	const isScratchPath = event.url.pathname === '/scratch_gui_connection'
	const isLocalhost = event.url.hostname === 'localhost' || event.url.hostname === '127.0.0.1'

	if (isScratchPath && isLocalhost) {
		const response = await resolve(event)
		response.headers.set('Access-Control-Allow-Origin', event.request.headers.get('origin') || '*')
		response.headers.set('Access-Control-Allow-Credentials', 'true')
		return response
	}

	return resolve(event)
}

const handleParaglide: Handle = async ({ event, resolve }) => {
	const cookieLang = event.cookies.get(langCookieName)
	const headerLang = extractLocaleFromHeader(event.request)

	const finalLang = isLocale(cookieLang)
		? cookieLang
		: isLocale(headerLang)
			? headerLang
			: baseLocale

	setLocale(finalLang)

	const dir = ['ar', 'he', 'fa', 'ckb'].includes(finalLang) ? 'rtl' : 'ltr'

	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%paraglide.lang%', finalLang).replace('%paraglide.dir%', dir),
	})
}

const handleAuth: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.match(/^\/projects\/[^/]+\/embed/)) {
		event.locals.user = null
		event.locals.session = null
		return resolve(event)
	}
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

const handleMaintenance: Handle = async ({ event, resolve }) => {
	if (isMaintenanceMode) {
		const user = event.locals.user
		const userRank = user?.rank ?? 0

		// If user is unauthenticated or rank is less than 2, lock them out
		if (userRank < 2) {
			// Return JSON payload if the client requested JSON data or performed a mutation (POST, PUT, etc.)
			if (
				event.request.headers.get('accept')?.includes('application/json') ||
				event.request.method !== 'GET'
			) {
				return new Response(JSON.stringify({ error: 'Service Unavailable due to maintenance.' }), {
					status: 503,
					headers: { 'Content-Type': 'application/json' },
				})
			}

			// Fallback to the imported static HTML payload for standard browser visits
			return new Response(
				maintenanceHtml.replaceAll('{AW3VERSION}', import.meta.env.VITE_NPM_PACKAGE_VERSION),
				{
					status: 503,
					headers: { 'Content-Type': 'text/html; charset=utf-8' },
				},
			)
		}
	}

	return resolve(event)
}

export const handleGuard: Handle = async ({ event, resolve }) => {
	const isAdminRoute = event.route.id?.startsWith('/(protected)/')
	const isNotGet = event.request.method !== 'GET'

	if (isAdminRoute && isNotGet) {
		const hasRank = event.locals.user?.rank === 3

		if (!event.locals.user || !hasRank) {
			throw error(404, 'Not Found')
		}
	}

	return resolve(event)
}

const handleBanned: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.match(/^\/projects\/[^/]+\/embed/)) {
		event.locals.user = null
		event.locals.session = null
		return resolve(event)
	}
	const user = event.locals.user
	if (!user) return resolve(event)

	const isPermittedPath = bannedPermittedPaths.includes(event.url.pathname)

	if (user.status === 'banned' && !isPermittedPath) {
		if (user.bannedExpiry && new Date().getTime() >= user.bannedExpiry.getTime()) {
			await db
				.update(table.user)
				.set({
					status: 'normal',
					bannedExpiry: null,
					banReason: null,
				})
				.where(eq(table.user.id, user.id))

			event.locals.user!.status = 'normal'
			event.locals.user!.bannedExpiry = null
			event.locals.user!.banReason = null

			return resolve(event)
		} else if (!isPermittedPath && event.request.method !== 'GET') {
			error(403, 'Account banned')
		} else if (!isPermittedPath && !event.url.pathname.startsWith('/uploads/')) {
			redirect(307, '/banned')
		}
	}

	return resolve(event)
}

let isInitialized = false
const handleSetup: Handle = async ({ event, resolve }) => {
	if (isInitialized) return resolve(event)
	const isRegisterPath = event.url.pathname.startsWith('/auth/')
	const userExists = await db.select({ id: table.user.id }).from(table.user).limit(1)

	if (userExists.length === 0) {
		if (!isRegisterPath) throw redirect(307, '/auth/register')
		else event.locals.isNewAw3 = true
	} else {
		isInitialized = true
	}
	if (isRegisterPath) return resolve(event)
}

export const handle: Handle = sequence(
	handleLocalhostConnection,
	handleSetup,
	handleAuth,
	handleMaintenance,
	handleBanned,
	handleGuard,
	handleParaglide,
)
