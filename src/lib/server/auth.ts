import type { RequestEvent } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { sha256 } from '@oslojs/crypto/sha2'
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { dev } from '$app/environment'

const DAY_IN_MS = 1000 * 60 * 60 * 24

export const sessionCookieName = 'aw3sessionid'

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18))
	const token = encodeBase64url(bytes)
	return token
}

export async function createSession(token: string, userId: number, ip: string, userAgent: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
	if (!userAgent) throw new Error('User-Agent missing')
	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30),
		ip,
		userAgent,
	}
	await db.insert(table.session).values(session)
	return session
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: {
				id: table.user.id,
				username: table.user.username,
				rank: table.user.rank ?? 0,
				status: table.user.status,
				banReason: table.user.banReason,
				bannedExpiry: table.user.bannedExpiry,
				hasPFP: table.user.hasPFP,
				frame: table.user.frame,
				isPrivate: table.user.isPrivate,
				scratchUsername: table.user.scratchUsername,
			},
			session: table.session,
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId))

	if (!result) {
		return { session: null, user: null }
	}
	const { session, user } = result

	const sessionExpired = Date.now() >= session.expiresAt.getTime()
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id))
		return { session: null, user: null }
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30)
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id))
	}

	return { session, user }
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>

export async function invalidateSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId))
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, 'Do_NOT_share_this..' + token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/',
		secure: !dev,
	})
}

/**
 * Migrates the pre-0.3 cookie (THIS_COOKIE_IS_COATED_WITH_BITTERANT) to the new cookie format.
 * @param event
 */
export async function migrateOldCookieName(event: RequestEvent) {
	if (!event.cookies.get('THIS_COOKIE_IS_COATED_WITH_BITTERANT')) {
		return
	}
	const [existingSession] = await db
		.select({ expiresAt: table.session.expiresAt })
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(
			eq(
				table.session.id,
				encodeHexLowerCase(
					sha256(
						new TextEncoder().encode(
							event.cookies.get('THIS_COOKIE_IS_COATED_WITH_BITTERANT')?.split('..')[1] as string,
						),
					),
				),
			),
		)
		.limit(1)
	const expiresAt = existingSession?.expiresAt ?? new Date(Date.now() + DAY_IN_MS * 30)
	setSessionTokenCookie(
		event,
		event.cookies.get('THIS_COOKIE_IS_COATED_WITH_BITTERANT')?.split('..')[1] as string,
		expiresAt,
	)
	event.cookies.delete('THIS_COOKIE_IS_COATED_WITH_BITTERANT', { path: '/' })
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/',
	})
}

export async function updateSessionDetails(
	sessionId: string,
	details: { ip: string; userAgent: string },
) {
	await db
		.update(table.session)
		.set({
			ip: details.ip,
			userAgent: details.userAgent,
		})
		.where(eq(table.session.id, sessionId))
}
