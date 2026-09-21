import { fail, redirect, type Actions } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getRequestEvent } from '$app/server'
import { db } from '$lib/server/db'
import { user } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { valkey } from '$lib/server/valkey'
import { sendEmail } from '$lib/server/email'
import emailContent from '$lib/server/emails/reset-password.html?raw'

const COOLDOWN_SECONDS = 30
const LOCKOUT_SECONDS = 3 * 60 * 60 // 3 hours
const MAX_ATTEMPTS = 10
const RESET_CODE_EXPIRY_SECONDS = 15 * 60 // 15 minutes

export const load: PageServerLoad = async () => {
	const { locals } = getRequestEvent()

	// Redirect logged-in users away if needed
	if (locals.user) {
		return redirect(302, '/')
	}

	return {
		email: null,
		hasEmail: false,
	}
}

export const actions: Actions = {
	sendResetEmail: async ({ request }) => {
		const formData = await request.formData()
		const username = formData?.get('username') as string

		if (!username) {
			return fail(400, { message: 'Username is required.' })
		}

		const [dbUser] = await db
			.select({ id: user.id, email: user.email, isEmailVerified: user.isEmailVerified })
			.from(user)
			.where(eq(user.username, username))
			.limit(1)

		if (!dbUser || !dbUser.email || !dbUser.isEmailVerified) {
			return fail(404, { message: 'No account found with that username.' })
		}

		const userId = dbUser.id
		const userEmail = dbUser.email
		const lockoutKey = `rate:reset:lockout:${userId}`
		const cooldownKey = `rate:reset:cooldown:${userId}`
		const attemptsKey = `rate:reset:attempts:${userId}`

		const lockoutTtl = await valkey.ttl(lockoutKey)
		if (lockoutTtl > 0) {
			const hoursLeft = Math.ceil(lockoutTtl / 3600)
			return fail(429, {
				message: `Too many password reset attempts. Please try again in ${hoursLeft} hour(s).`,
			})
		}

		const cooldownTtl = await valkey.ttl(cooldownKey)
		if (cooldownTtl > 0) {
			return fail(429, {
				message: `Please wait ${cooldownTtl} second(s) before requesting another reset email.`,
			})
		}

		try {
			const attempts = await valkey.incr(attemptsKey)

			if (attempts === 1) {
				await valkey.expire(attemptsKey, LOCKOUT_SECONDS)
			}

			if (attempts >= MAX_ATTEMPTS) {
				await valkey.set(lockoutKey, 'locked', 'EX', LOCKOUT_SECONDS)
				await valkey.del(attemptsKey)
				return fail(429, {
					message: 'Maximum attempts reached. You have been locked out for 3 hours.',
				})
			}

			await valkey.set(cooldownKey, 'active', 'EX', COOLDOWN_SECONDS)

			const resetToken = crypto.randomUUID()
			const resetCodeKey = `reset:token:${resetToken}`

			await valkey.set(resetCodeKey, userId, 'EX', RESET_CODE_EXPIRY_SECONDS)

			const origin = new URL(request.url).origin
			const resetLink = `${origin}/auth/reset-password?token=${resetToken}`

			await sendEmail({
				to: userEmail,
				subject: 'Reset your password',
				data: {
					title: 'Reset your password',
					content: emailContent.replaceAll('{link}', resetLink).replaceAll('{username}', username),
				},
			})

			return {
				success: true,
			}
		} catch (e) {
			console.error(e)
			return fail(500, { message: 'Failed to send password reset email.' })
		}
	},

	clearEmail: async () => {
		return {
			cleared: true,
		}
	},
}
