import { fail, redirect, type Actions } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { regenerateUserProfileCache } from '$lib/server/auth'
import { valkey } from '$lib/server/valkey'
import { sendVerificationEmail } from '$lib/server/verify-email'

const COOLDOWN_SECONDS = 30
const LOCKOUT_SECONDS = 3 * 60 * 60 // 3 hours in seconds
const MAX_ATTEMPTS = 10

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session || !locals.user) {
		return {
			email: null,
			hasEmail: false,
		}
	}

	if (!locals.user.isEmailVerified) return redirect(302, '/auth/verify')

	const [dbUser] = await db
		.select({ email: table.user.email })
		.from(table.user)
		.where(eq(table.user.id, locals.user.id))
		.limit(1)

	const userEmail = dbUser?.email ?? locals.user.email ?? null

	return {
		email: userEmail,
		hasEmail: Boolean(userEmail),
	}
}

export const actions: Actions = {
	updateEmail: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		const userId = locals.user.id
		const lockoutKey = `rate:email:lockout:${userId}`
		const cooldownKey = `rate:email:cooldown:${userId}`
		const attemptsKey = `rate:email:attempts:${userId}`

		const formData = await request.formData()
		let userEmail = formData?.get('email') as string

		if (!userEmail) {
			return fail(400, { message: 'No email provided.' })
		}

		if (userEmail === locals.user.email) {
			return fail(400, { message: 'Email is the same as the current one' })
		}

		const lockoutTtl = await valkey.ttl(lockoutKey)
		if (lockoutTtl > 0) {
			const hoursLeft = Math.ceil(lockoutTtl / 3600)
			return fail(429, {
				message: `Too many resend attempts. Please try again in ${hoursLeft} hour(s).`,
			})
		}

		const cooldownTtl = await valkey.ttl(cooldownKey)
		if (cooldownTtl > 0) {
			return fail(429, {
				message: `Please wait ${cooldownTtl} second(s) before requesting another email.`,
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

			const newVerifyID = crypto.randomUUID()

			const [updatedUser] = await db
				.update(table.user)
				.set({
					email: userEmail,
					isEmailVerified: false,
					verifyID: newVerifyID,
				})
				.where(eq(table.user.id, locals.user.id))
				.returning({ verifyID: table.user.verifyID, email: table.user.email })

			if (!updatedUser?.verifyID) {
				return fail(404, { message: 'User not found.' })
			}

			await regenerateUserProfileCache(locals.user.id)

			const origin = new URL(request.url).origin

			await sendVerificationEmail({
				to: userEmail,
				verifyID: updatedUser.verifyID,
				origin,
			})

			return redirect(302, '/auth/verify')
		} catch (e) {
			if ((e as { status?: number })?.status === 302) {
				throw e
			}
			console.error(e)
			return fail(500, { message: 'Failed to send verification email.' })
		}
	},
}
