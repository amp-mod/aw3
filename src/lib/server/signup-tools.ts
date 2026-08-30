import * as auth from '$lib/server/auth'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { isValidUsername } from '$lib/username'
import { eq, sql, and, gt } from 'drizzle-orm'

// --- PRIVATE HELPERS ---
export async function createNewUser(username: string, passwordHash: string, isScratch = false) {
	return await db.transaction(async (tx) => {
		const existing = await tx
			.select({ id: table.user.id })
			.from(table.user)
			.where(eq(table.user.username, username))
			.limit(1)

		if (!isValidUsername(username)) {
			return { error: 'Invalid username', status: 400 }
		}
		if (existing.length > 0) return { error: 'Username already exists', status: 409 }
		const activeRedirect = await tx
			.select({ id: table.userRedirects.id })
			.from(table.userRedirects)
			.where(
				and(
					eq(table.userRedirects.fromUsername, username),
					gt(table.userRedirects.expiresAt, new Date()),
				),
			)
			.limit(1)

		if (activeRedirect.length > 0) {
			return { error: 'Username is currently reserved by a redirected account', status: 409 }
		}

		const userCount = await tx.select({ count: sql<number>`count(*)` }).from(table.user)
		const assignedRank = Number(userCount[0].count) === 0 ? 3 : 0

		const [newUser] = await tx
			.insert(table.user)
			.values({
				username, // Already normalized
				passwordHash,
				rank: assignedRank,
				scratchUsername: isScratch ? username : null,
			})
			.returning({ id: table.user.id })
		if (newUser.id !== 1) {
			await tx
				.insert(table.follow)
				.values({
					followerId: newUser.id,
					followingId: 1,
				})
				.onConflictDoNothing()
		}

		return { newUser, status: 200 }
	})
}
export async function establishSession(event: any, userId: number) {
	const sessionToken = auth.generateSessionToken()
	const session = await auth.createSession(
		sessionToken,
		userId,
		event.getClientAddress(),
		event.request.headers.get('user-agent'),
	)
	auth.setSessionTokenCookie(event, sessionToken, session.expiresAt)
}
export function clearScratchCookies(cookies: any) {
	const opts = { path: '/' }
	cookies.delete('s_reg_user', opts)
	cookies.delete('s_reg_token', opts)
	cookies.delete('s_reg_comment', opts)
	cookies.delete('s_reg_pw', opts)
}
export function validateUsername(username: string): boolean {
	// Only lowercase allowed post-normalization
	return username.length >= 3 && username.length <= 20 && /^[a-z0-9_-]+$/.test(username)
}
export function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255
}
