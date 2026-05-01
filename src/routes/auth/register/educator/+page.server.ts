import { hash } from '@node-rs/argon2'
import { fail, redirect } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { Actions, PageServerLoad } from './$types'
import { eq, sql } from 'drizzle-orm'
import { isProfane } from '$lib/server/bad-word-checker'

export const load: PageServerLoad = async (event) => {
	// If already logged in, go home
	if (event.locals.user) {
		return redirect(302, '/')
	}
	return {}
}

export const actions: Actions = {
	submitEducator: async (event) => {
		const formData = await event.request.formData()

		// 1. Basic Data Extraction
		const username = (formData.get('username') as string)?.toLowerCase().trim() ?? ''
		const password = formData.get('password') as string
		const fullName = formData.get('fullName') as string
		const schoolName = formData.get('schoolName') as string
		const schoolEmail = (formData.get('schoolEmail') as string)?.toLowerCase().trim() ?? ''
		const country = formData.get('country') as string
		const state = formData.get('state') as string
		const website = formData.get('website') as string

		// 2. Security & Profanity Validation
		if (!validateUsername(username) || isProfane(username, true)) {
			return fail(400, { message: 'Invalid or profane username.' })
		}
		if (isProfane(fullName) || isProfane(schoolName)) {
			return fail(400, { message: 'Profanity detected in personal or school information.' })
		}
		if (password.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters.' })
		}

		// 3. Prevent Self-Doxing (Username shouldn't contain real name/school)
		const nameParts = fullName.toLowerCase().split(' ')
		if (
			nameParts.some((part) => part.length > 2 && username.includes(part)) ||
			username.includes(schoolName.toLowerCase())
		) {
			return fail(400, {
				message: 'For privacy, your username cannot contain your real name or school name.',
			})
		}

		// 4. Availability Check
		const existing = await db.query.user.findFirst({
			where: eq(table.user.username, username),
		})
		if (existing) return fail(400, { message: 'Username is already taken.' })

		// 5. Password Hashing
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		})

		// 6. Database Entry (Pending Review)
		try {
			await db.transaction(async (tx) => {
				// Insert into user table but with a "pending" or "guest" rank
				// and a flag for manual review if your schema supports it.
				// We assume rank 0 is standard, rank 1 is educator, but we start at -1 (Pending)
				await tx.insert(table.user).values({
					username,
					passwordHash,
					rank: -1, // Use -1 or a specific 'pending' status
					email: schoolEmail,
					// Storing extra metadata in a JSON column or dedicated educator table:
					// metadata: { fullName, schoolName, country, state, website }
				})

				// Note: In a real app, you might have a table.educatorApplications.insert(...) here instead
			})
		} catch (e) {
			console.error('Educator Registration Error:', e)
			return fail(500, { message: 'Failed to save application. Please try again later.' })
		}

		// Success - UI will show Step 3 (Success/Pending message)
		return { success: true }
	},
}

function validateUsername(username: string): boolean {
	return username.length >= 3 && username.length <= 20 && /^[a-z0-9_-]+$/.test(username)
}
