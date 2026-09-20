import { verify } from '@node-rs/argon2'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import * as auth from '$lib/server/auth'
import { eq } from 'drizzle-orm'
import { env } from '$env/dynamic/private'

export const actions: Actions = {
	delete: async (event) => {
		const { locals, request } = event
		const { user, session } = locals

		if (!user || !session) {
			return fail(401, { message: 'Unauthorized' })
		}

		const formData = await request.formData()
		const password = formData.get('password')

		if (typeof password !== 'string' || !password) {
			return fail(400, { message: 'Password is required' })
		}

		const [existingUser] = await db
			.select({ passwordHash: table.user.passwordHash })
			.from(table.user)
			.where(eq(table.user.id, user.id))

		if (!existingUser?.passwordHash) {
			return fail(400, { message: 'User record not found' })
		}

		const validPassword = await verify(existingUser.passwordHash, password)

		if (!validPassword) {
			return fail(400, { message: 'Incorrect password' })
		}

		if (env.DISCOURSE_API_KEY && env.DISCOURSE_URL) {
			try {
				const discourseUrl = env.DISCOURSE_URL.replace(/\/$/, '')
				const headers = {
					'Api-Key': env.DISCOURSE_API_KEY,
					'Api-Username': env.DISCOURSE_API_USERNAME ?? 'system',
				}

				const userRes = await fetch(`${discourseUrl}/u/by-external/${user.id}.json`, { headers })

				if (userRes.ok) {
					const discourseData = await userRes.json()
					const discourseUserId = discourseData.user?.id

					if (discourseUserId) {
						await fetch(`${discourseUrl}/admin/users/${discourseUserId}/anonymize.json`, {
							method: 'PUT',
							headers,
						})
					}
				}
			} catch (err) {
				console.error('Failed to anonymize Discourse user:', err)
			}
		}

		await db.delete(table.user).where(eq(table.user.id, user.id))

		auth.deleteSessionTokenCookie(event)

		throw redirect(303, '/')
	},
}
