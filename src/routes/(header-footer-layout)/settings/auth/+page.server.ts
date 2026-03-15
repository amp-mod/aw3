import { fail, type Actions } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import { user, authenticator } from '$lib/server/db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyPassword, hashPassword } from '$lib/server/auth' // Your argon2/bcrypt wrappers

export const actions: Actions = {
	updatePassword: async ({ request, locals }) => {
		const session = await locals.auth()
		if (!session?.user?.id) {
			return fail(401, { message: 'Unauthorized' })
		}

		const data = await request.formData()
		const currentPassword = data.get('currentPassword') as string
		const newPassword = data.get('newPassword') as string

		if (!currentPassword || !newPassword) {
			return fail(400, { message: 'Missing fields.' })
		}

		if (newPassword.length < 8) {
			return fail(400, { message: 'Password too short.' })
		}

		try {
			// 1. Get the user from the DB
			const currentUser = await db.query.user.findFirst({
				where: eq(user.id, session.user.id),
			})

			if (!currentUser) return fail(404, { message: 'User not found.' })

			// 2. Verify current password
			const isValid = await verifyPassword(currentUser.passwordHash, currentPassword)
			if (!isValid) {
				return fail(400, { message: 'Incorrect current password.' })
			}

			// 3. Update with new hash
			const passwordHash = await hashPassword(newPassword)
			await db.update(user).set({ passwordHash }).where(eq(user.id, currentUser.id))

			return { passwordSuccess: true }
		} catch (err) {
			return fail(500, { message: 'Database error occurred.' })
		}
	},

	deletePasskey: async ({ request, locals }) => {
		const session = await locals.auth()
		if (!session?.user?.id) return fail(401)

		const data = await request.formData()
		const passkeyId = data.get('id') as string

		if (!passkeyId) return fail(400, { message: 'No ID provided' })

		try {
			// Ensure the passkey belongs to the user before deleting
			await db
				.delete(authenticator)
				.where(and(eq(authenticator.id, passkeyId), eq(authenticator.userId, session.user.id)))

			return { success: true }
		} catch (err) {
			return fail(500, { message: 'Failed to delete passkey.' })
		}
	},

	disable2FA: async ({ locals }) => {
		return { success: true }
	},
}
