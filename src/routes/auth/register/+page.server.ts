import { hash } from '@node-rs/argon2'
import { fail, redirect } from '@sveltejs/kit'
import * as auth from '$lib/server/auth'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import ype { Actions, PageServerLoad } from './$types'
import { verifySolution } from 'altcha-lib'
import { hmacKey } from '$lib/server/hmac'
import { eq, sql } from 'drizzle-orm'
import { isProfane } from '$lib/server/bad-word-checker'

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/')
	}
	return { isNew: event.locals.isNewAw3 }
}

export const actions: Actions = {
	register: async (event) => {
		const formData = await event.request.formData()
		const username = (formData.get('username') as string) ?? ''
		const password = formData.get('password')

		if (!validateUsername(username) || isProfane(username, true)) {
			return fail(400, { message: 'Invalid username' })
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password' })
		}

		const altchaPayload = formData.get('altcha')
		if (!altchaPayload || typeof altchaPayload !== 'string') {
			return fail(400, { message: 'Missing CAPTCHA payload' })
		}

		const ok = await verifySolution(altchaPayload, hmacKey)
		if (!ok) {
			return fail(400, { message: 'CAPTCHA failed' })
		}

		const passwordHash = await hash(password as string, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		})

		try {
			const result = await db.transaction(async (tx) => {
				const existingUser = await tx
					.select({ id: table.user.id })
					.from(table.user)
					.where(eq(table.user.username, username.toLowerCase()))
					.limit(1)

				if (existingUser.length > 0) {
					return { error: 'Username already exists', status: 409 }
				}

				const userCount = await tx.select({ count: sql<number>`count(*)` }).from(table.user)

				const isFirstUser = Number(userCount[0].count) === 0
				const assignedRank = isFirstUser ? 3 : 0

				const [newUser] = await tx
					.insert(table.user)
					.values({
						username: username.toLowerCase(),
						passwordHash,
						rank: assignedRank,
					})
					.returning({ id: table.user.id })

				return { newUser, status: 200 }
			})

			if ('error' in result) {
				return fail(result.status, { message: result.error })
			}

			// 4. Create Session
			const sessionToken = auth.generateSessionToken()
			const session = await auth.createSession(
				sessionToken,
				result.newUser.id,
				event.getClientAddress(),
				event.request.headers.get('user-agent'),
			)
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt)
		} catch (e) {
			console.error(e)
			return fail(500, { message: 'An error occurred during registration' })
		}

		return redirect(302, '/')
	},

	checkUsername: async ({ request }) => {
		const formData = await request.formData()
		const username = (formData.get('username') as string) ?? ''

		if (isProfane(username, true)) {
			return { available: false, message: 'Username is profane.' }
		}
		if (!validateUsername(username)) {
			return {
				available: false,
				message: 'Usernames must be 3-20 characters (lowercase, numbers, underscores, dashes).',
			}
		}

		const existingUser = await db
			.select({ id: table.user.id })
			.from(table.user)
			.where(eq(table.user.username, username.toLowerCase()))
			.limit(1)

		if (existingUser.length > 0) {
			return { available: false, message: 'Username already taken.' }
		}

		return { available: true }
	},
}

function validateUsername(username: unknown): username is string {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 20 &&
		/^[a-z0-9_-]+$/.test(username)
	)
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255
}
