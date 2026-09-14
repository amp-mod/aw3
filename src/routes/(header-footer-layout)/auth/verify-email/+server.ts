import { error, redirect, type RequestHandler } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import { user } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { regenerateUserProfileCache } from '$lib/server/auth'

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth/login-modal')
	}

	const verifyID = url.searchParams.get('id')

	if (!verifyID) {
		error(400, 'Missing verification ID.')
	}

	const [existingUser] = await db.select().from(user).where(eq(user.verifyID, verifyID)).limit(1)

	if (!existingUser) {
		error(404, 'Invalid or expired verification link.')
	}

	if (existingUser.id !== locals.user.id) {
		error(403, 'This verification link is for a different account.')
	}

	await db
		.update(user)
		.set({
			isEmailVerified: true,
			verifyID: crypto.randomUUID(),
		})
		.where(eq(user.id, existingUser.id))

	await regenerateUserProfileCache(existingUser.id)

	redirect(302, '/')
}
