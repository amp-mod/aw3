import { fail, redirect, type Actions } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getRequestEvent } from '$app/server'
import { db } from '$lib/server/db'
import { user } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { regenerateUserProfileCache } from '$lib/server/auth'
import { valkey } from '$lib/server/valkey'
import { sendVerificationEmail } from '$lib/server/verify-email'

const COOLDOWN_SECONDS = 30
const LOCKOUT_SECONDS = 3 * 60 * 60 // 3 hours in seconds
const MAX_ATTEMPTS = 10

export const load: PageServerLoad = async () => {
	const { locals } = getRequestEvent()

	if (!locals.user) {
		return redirect(302, '/')
	}

	if (locals.user.isEmailVerified) {
		return redirect(302, '/')
	}

	// Fetch fresh user data directly from DB to avoid stale session cache issues
	const [dbUser] = await db
		.select({ email: user.email })
		.from(user)
		.where(eq(user.id, locals.user.id))
		.limit(1)

	const userEmail = dbUser?.email ?? locals.user.email ?? null

	return {
		email: userEmail,
		hasEmail: Boolean(userEmail),
	}
}

export const actions: Actions = {
	// Sets (or updates) email and sends verification link
	sendVerification: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		const userId = locals.user.id
		const lockoutKey = `rate:email:lockout:${userId}`
		const cooldownKey = `rate:email:cooldown:${userId}`
		const attemptsKey = `rate:email:attempts:${userId}`

		// 1. Check if user is locked out
		const lockoutTtl = await valkey.ttl(lockoutKey)
		if (lockoutTtl > 0) {
			const hoursLeft = Math.ceil(lockoutTtl / 3600)
			return fail(429, {
				message: `Too many resend attempts. Please try again in ${hoursLeft} hour(s).`,
			})
		}

		// 2. Check 30-second cooldown
		const cooldownTtl = await valkey.ttl(cooldownKey)
		if (cooldownTtl > 0) {
			return fail(429, {
				message: `Please wait ${cooldownTtl} second(s) before requesting another email.`,
			})
		}

		const formData = await request.formData()
		let userEmail = formData?.get('email') as string

		if (!userEmail) {
			userEmail = locals.user.email ?? ''
		}

		if (!userEmail) {
			return fail(400, { message: 'No email provided.' })
		}

		try {
			// Increment attempt count
			const attempts = await valkey.incr(attemptsKey)

			if (attempts === 1) {
				// Expire attempts after the 3-hour threshold window
				await valkey.expire(attemptsKey, LOCKOUT_SECONDS)
			}

			if (attempts >= MAX_ATTEMPTS) {
				// Lock out for 3 hours and clean up attempts counter
				await valkey.set(lockoutKey, 'locked', 'EX', LOCKOUT_SECONDS)
				await valkey.del(attemptsKey)
				return fail(429, {
					message: 'Maximum attempts reached. You have been locked out for 3 hours.',
				})
			}

			// Set 30-second cooldown
			await valkey.set(cooldownKey, 'active', 'EX', COOLDOWN_SECONDS)

			const [updatedUser] = await db
				.update(user)
				.set({ email: userEmail })
				.where(eq(user.id, locals.user.id))
				.returning({ verifyID: user.verifyID, email: user.email })

			if (!updatedUser?.verifyID) {
				return fail(404, { message: 'User not found.' })
			}

			// Await cache regeneration so session updates before response finishes
			await regenerateUserProfileCache(locals.user.id)

			const origin = new URL(request.url).origin

			// Delegate email assembly and delivery to dedicated helper
			await sendVerificationEmail({
				to: userEmail,
				verifyID: updatedUser.verifyID,
				origin,
			})

			return {
				success: true,
				email: updatedUser.email,
			}
		} catch (e) {
			console.error(e)
			return fail(500, { message: 'Failed to send verification email.' })
		}
	},

	clearEmail: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		try {
			await db.update(user).set({ email: null }).where(eq(user.id, locals.user.id))

			// Invalidate cache after clearing email
			await regenerateUserProfileCache(locals.user.id)

			return {
				cleared: true,
			}
		} catch (e) {
			console.error(e)
			return fail(500, { message: 'Failed to clear email address.' })
		}
	},
}
