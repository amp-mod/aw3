import type { RequestEvent } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { sha256 } from '@oslojs/crypto/sha2'
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { dev } from '$app/environment'
import { valkey } from './valkey'

const DAY_IN_MS = 1000 * 60 * 60 * 24

export const sessionCookieName = 'aw3sessionid'

function parseDates(obj: any) {
	if (!obj) return obj
	if (obj.expiresAt) obj.expiresAt = new Date(obj.expiresAt)
	if (obj.bannedExpiry) obj.bannedExpiry = new Date(obj.bannedExpiry)
	if (obj.usernameUpdatedAt) obj.usernameUpdatedAt = new Date(obj.usernameUpdatedAt)
	return obj
}

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

/**
 * Fetches user profile from Valkey or falls back to DB.
 */
export async function getUserProfile(userId: number) {
	const profileKey = `user:profile:${userId}`

	const cached = await valkey.get(profileKey)
	if (cached) {
		return parseDates(JSON.parse(cached))
	}

	const [user] = await db
		.select({
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
			usernameUpdatedAt: table.user.usernameUpdatedAt,
			termsRevision: table.user.termsRevision,
			privacyRevision: table.user.privacyRevision,
			featuredProjectId: table.user.featuredProjectId,
			featuredProjectTitleIndex: table.user.featuredProjectTitleIndex,
		})
		.from(table.user)
		.where(eq(table.user.id, userId))

	if (user) {
		regenerateUserProfileCache(userId)
	}

	return user ?? null
}

/**
 * Forces a fresh database lookup and updates the user profile in Valkey.
 * Call this whenever a user updates their profile, frame, or settings.
 */
export async function regenerateUserProfileCache(userId: number) {
	const profileKey = `user:profile:${userId}`

	const [user] = await db
		.select({
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
			usernameUpdatedAt: table.user.usernameUpdatedAt,
			termsRevision: table.user.termsRevision,
			privacyRevision: table.user.privacyRevision,
			featuredProjectId: table.user.featuredProjectId,
			featuredProjectTitleIndex: table.user.featuredProjectTitleIndex,
		})
		.from(table.user)
		.where(eq(table.user.id, userId))

	if (!user) {
		await valkey.del(profileKey)
		return null
	}

	await valkey.set(profileKey, JSON.stringify(user), 'EX', 300)
	return user
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
	const sessionCacheKey = `session:${sessionId}`

	// 1. Try to fetch session metadata from Valkey
	let session: table.Session | null = null
	const cachedSession = await valkey.get(sessionCacheKey)

	if (cachedSession) {
		session = parseDates(JSON.parse(cachedSession))
	} else {
		// Fallback to DB if session isn't in Valkey
		const [result] = await db.select().from(table.session).where(eq(table.session.id, sessionId))

		if (!result) {
			return { session: null, user: null }
		}

		session = result

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

		// Store session metadata in Valkey
		const ttlSeconds = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000))
		await valkey.set(sessionCacheKey, JSON.stringify(session), 'EX', ttlSeconds)
	}

	// 2. Fetch profile from the dedicated profile cache or DB fallback
	const user = await getUserProfile(session.userId)

	if (!user) {
		await invalidateSession(sessionId)
		return { session: null, user: null }
	}

	return { session, user }
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>

export async function purgeSessionCache(sessionId: string) {
	await valkey.del(`session:${sessionId}`)
}

export async function invalidateSession(sessionId: string) {
	await purgeSessionCache(sessionId)
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
	await purgeSessionCache(sessionId)
	await db
		.update(table.session)
		.set({
			ip: details.ip,
			userAgent: details.userAgent,
		})
		.where(eq(table.session.id, sessionId))
}
