import { verify } from '@node-rs/argon2'
import { json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import * as auth from '$lib/server/auth'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async (event) => {
	const ip = event.getClientAddress()
	const formData = await event.request.formData()
	const username = formData.get('username')
	const password = formData.get('password')

	if (!validateUsername(username)) {
		return json({ message: 'Invalid username (3-20 chars, alphanumeric only)' }, { status: 400 })
	}
	if (!validatePassword(password)) {
		return json({ message: 'Invalid password (min 6 characters)' }, { status: 400 })
	}

	const results = await db.select().from(table.user).where(eq(table.user.username, username))
	const existingUser = results.at(0)

	if (!existingUser) {
		return json({ message: 'Incorrect username or password' }, { status: 400 })
	}

	const validPassword = await verify(existingUser.passwordHash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	})

	if (!validPassword) {
		return json({ message: 'Incorrect username or password' }, { status: 400 })
	}

	const sessionToken = auth.generateSessionToken()
	const session = await auth.createSession(
		sessionToken,
		existingUser.id,
		ip,
		event.request.headers.get('user-agent'),
	)
	auth.setSessionTokenCookie(event, sessionToken, session.expiresAt)

	return json({ success: true })
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
