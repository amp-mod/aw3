import type { RequestEvent } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { sha256 } from '@oslojs/crypto/sha2'
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { dev } from '$app/environment'
import { valkey } from './valkey'

const DAY_IN_MS = 1000 * 60 * 60 * 24
const PROFILE_TTL_SECONDS = 300

export const sessionCookieName = 'aw3sessionid'

const userProfileFields = {
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
	email: table.user.email,
	isEmailVerified: table.user.isEmailVerified,
	accentColour: table.user.accentColour,
}

function parseDates(obj: any) {
	if (!obj) return obj
	if (obj.expiresAt) obj.expiresAt = new Date(obj.expiresAt)
	if (obj.bannedExpiry) obj.bannedExpiry = new Date(obj.bannedExpiry)
	if (obj.usernameUpdatedAt) obj.usernameUpdatedAt = new Date(obj.usernameUpdatedAt)
	return obj
}

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18))
	return encodeBase64url(bytes)
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

	// Save to DB and populate Valkey immediately so the next request is a cache hit
	await Promise.all([
		db.insert(table.session).values(session),
		valkey.set(`session:${sessionId}`, JSON.stringify(session), 'EX', 30 * 24 * 60 * 60),
	])

	return session
}

/**
 * Fetches user profile from Valkey or falls back to DB and sets cache.
 */
export async function getUserProfile(userId: number) {
	const profileKey = `user:profile:${userId}`

	const cached = await valkey.get(profileKey)
	if (cached) {
		return parseDates(JSON.parse(cached))
	}

	const [user] = await db
		.select(userProfileFields)
		.from(table.user)
		.where(eq(table.user.id, userId))

	if (!user) return null

	// OPTIMIZATION: Write back to Valkey on cache miss
	await valkey.set(profileKey, JSON.stringify(user), 'EX', PROFILE_TTL_SECONDS)
	return user
}

/**
 * Forces a fresh database lookup and updates the user profile in Valkey.
 */
export async function regenerateUserProfileCache(userId: number) {
	const profileKey = `user:profile:${userId}`

	const [user] = await db
		.select(userProfileFields)
		.from(table.user)
		.where(eq(table.user.id, userId))

	if (!user) {
		await valkey.del(profileKey)
		return null
	}

	await valkey.set(profileKey, JSON.stringify(user), 'EX', PROFILE_TTL_SECONDS)
	return user
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
	const sessionCacheKey = `session:${sessionId}`

	// 1. Check Valkey cache first
	const cachedSessionStr = await valkey.get(sessionCacheKey)

	let session: table.Session | null = null

	if (cachedSessionStr) {
		session = parseDates(JSON.parse(cachedSessionStr))
	} else {
		// Fallback to DB query
		const [result] = await db.select().from(table.session).where(eq(table.session.id, sessionId))

		if (!result) {
			return { session: null, user: null }
		}

		session = result
		const now = Date.now()

		if (now >= session.expiresAt.getTime()) {
			await db.delete(table.session).where(eq(table.session.id, session.id))
			return { session: null, user: null }
		}

		// Renew session if within 15 days of expiration
		if (now >= session.expiresAt.getTime() - DAY_IN_MS * 15) {
			session.expiresAt = new Date(now + DAY_IN_MS * 30)
			await db
				.update(table.session)
				.set({ expiresAt: session.expiresAt })
				.where(eq(table.session.id, session.id))
		}

		const ttlSeconds = Math.max(1, Math.floor((session.expiresAt.getTime() - now) / 1000))
		await valkey.set(sessionCacheKey, JSON.stringify(session), 'EX', ttlSeconds)
	}

	// 2. Fetch associated user profile
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
	await Promise.all([
		purgeSessionCache(sessionId),
		db.delete(table.session).where(eq(table.session.id, sessionId)),
	])
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

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, { path: '/' })
}

export async function updateSessionDetails(
	sessionId: string,
	details: { ip: string; userAgent: string },
) {
	// Delete cache and update database concurrently
	await Promise.all([
		purgeSessionCache(sessionId),
		db
			.update(table.session)
			.set({
				ip: details.ip,
				userAgent: details.userAgent,
			})
			.where(eq(table.session.id, sessionId)),
	])
}
