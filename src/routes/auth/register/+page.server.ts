import { hash } from '@node-rs/argon2'
import { encodeBase32LowerCase } from '@oslojs/encoding'
import { fail, redirect } from '@sveltejs/kit'
import * as auth from '$lib/server/auth'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { Actions, PageServerLoad } from './$types'
import { verifySolution } from 'altcha-lib'
import { hmacKey } from '$lib/server/hmac'
import { eq } from 'drizzle-orm'
import { isProfane } from '$lib/server/bad-word-checker'

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/')
	}
	return {}
}

export const actions: Actions = {
	register: async (event) => {
		const formData = await event.request.formData()
		const username = formData.get('username') as string
		const password = formData.get('password')

		if (!validateUsername(username) || isProfane(username, true)) {
			return fail(400, { message: 'Invalid username' })
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password' })
		}
		const altchaPayload = formData.get('altcha')

		if (!altchaPayload || typeof altchaPayload !== 'string') {
			return { success: false, error: 'Missing payload' }
		}

		const ok = await verifySolution(altchaPayload, hmacKey)
		if (!ok) {
			return { success: false, error: 'CAPTCHA failed' }
		}
		const userId = generateUserId()
		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		})
		const existingUser = (
			await db
				.select({ id: table.user.id })
				.from(table.user)
				.where(eq(table.user.username, username.toLowerCase()))
				.limit(1)
		)[0]
		if (existingUser) {
			return fail(409, { message: 'Username already exists' })
		}

		try {
			await db.insert(table.user).values({ id: userId, username, passwordHash })

			const sessionToken = auth.generateSessionToken()
			const session = await auth.createSession(sessionToken, userId)
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt)
		} catch {
			return fail(500, { message: 'An error has occurred' })
		}
		return { success: true }
	},
	checkUsername: async ({ request }) => {
		const formData = await request.formData()
		const username = formData.get('username') as string

		if (isProfane(username, true)) {
			return { available: false, message: 'Username is profane.' }
		}
		if (!validateUsername(username)) {
			return {
				available: false,
				message:
					'Usernames must only consist of lowercase alphanumeric characters, underscores and dashes. They must also be 3-20 characters long.',
			}
		}

		const existingUser = (
			await db
				.select({ id: table.user.id })
				.from(table.user)
				.where(eq(table.user.username, username.toLowerCase()))
				.limit(1)
		)[0]

		if (existingUser) {
			return { available: false, message: 'Username already taken.' }
		}

		return { available: true }
	},
}

function generateUserId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.
	const bytes = crypto.getRandomValues(new Uint8Array(15))
	const id = encodeBase32LowerCase(bytes)
	return id
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
