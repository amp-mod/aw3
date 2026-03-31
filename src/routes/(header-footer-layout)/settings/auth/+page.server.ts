import { fail, type Actions } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, and } from 'drizzle-orm'
import { hash, verify } from '@node-rs/argon2'

export const actions: Actions = {
	updatePassword: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		const data = await request.formData()
		const currentPassword = data.get('currentPassword')
		const newPassword = data.get('newPassword')

		if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
			return fail(400, { message: 'Invalid input.' })
		}

		if (newPassword.length < 8) {
			return fail(400, { message: 'Password too short.' })
		}

		try {
			const [currentUser] = await db
				.select()
				.from(table.user)
				.where(eq(table.user.id, locals.user.id))
				.limit(1)

			if (!currentUser || !currentUser.passwordHash) {
				return fail(404, { message: 'User or password record not found.' })
			}

			const isValid = await verify(currentUser.passwordHash, currentPassword)
			if (!isValid) {
				return fail(400, { message: 'Incorrect current password.' })
			}

			const passwordHash = await hash(newPassword)
			await db.update(table.user).set({ passwordHash }).where(eq(table.user.id, currentUser.id))

			return { passwordSuccess: true }
		} catch (err) {
			console.error('Password update error:', err)
			return fail(500, { message: 'An internal error occurred.' })
		}
	},

	deletePasskey: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		const data = await request.formData()
		const passkeyId = data.get('id') as string

		if (!passkeyId) return fail(400, { message: 'No ID provided.' })

		try {
			await db
				.delete(table.authenticator)
				.where(
					and(
						eq(table.authenticator.id, passkeyId),
						eq(table.authenticator.userId, locals.user.id),
					),
				)

			return { success: true }
		} catch (err) {
			return fail(500, { message: 'Failed to delete passkey.' })
		}
	},

	disable2FA: async ({ locals }) => {
		if (!locals.session || !locals.user) return fail(401)

		// WIP
		return { success: true }
	},
}
