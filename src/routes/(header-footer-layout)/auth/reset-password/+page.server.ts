import { fail, redirect, type Actions } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { hash } from '@node-rs/argon2'
import { valkey } from '$lib/server/valkey'

export const actions: Actions = {
	resetPassword: async ({ request }) => {
		const data = await request.formData()
		const token = data.get('token')
		const newPassword = data.get('newPassword')

		if (typeof token !== 'string' || !token) {
			return fail(400, { message: 'Invalid or missing reset token.' })
		}

		if (typeof newPassword !== 'string' || newPassword.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters long.' })
		}

		const resetCodeKey = `reset:token:${token}`

		try {
			const userId = await valkey.get(resetCodeKey)

			if (!userId) {
				return fail(400, {
					message: 'Password reset link is invalid or has expired. Please request a new one.',
				})
			}

			const [currentUser] = await db
				.select({ id: table.user.id })
				.from(table.user)
				.where(eq(table.user.id, userId))
				.limit(1)

			if (!currentUser) {
				return fail(404, { message: 'User account not found.' })
			}

			const passwordHash = await hash(newPassword)
			await db.update(table.user).set({ passwordHash }).where(eq(table.user.id, currentUser.id))

			await db.delete(table.session).where(eq(table.session.userId, currentUser.id))

			await valkey.del(resetCodeKey)
		} catch (err) {
			console.error('Password reset error:', err)
			return fail(500, { message: 'Failed to reset password. Please try again later.' })
		}

		return redirect(302, '/auth/login-modal')
	},
}
