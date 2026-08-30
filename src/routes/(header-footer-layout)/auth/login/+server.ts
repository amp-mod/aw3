import { verify } from '@node-rs/argon2'
import { json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import * as auth from '$lib/server/auth'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async (event) => {
	const ip = event.getClientAddress() ?? '127.0.0.1'
	const formData = await event.request.formData()
	const username = formData.get('username')
	const password = formData.get('password')

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
		event.request.headers.get('user-agent') ?? '',
	)
	auth.setSessionTokenCookie(event, sessionToken, session.expiresAt)

	return json({ success: true })
}
