import { fail, error } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { eq, and, ne } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { generateVerificationData, findVerificationToken } from '$lib/server/scratch-verify'

export const load: PageServerLoad = async ({ cookies, locals }) => {
	// 1. Ensure user is logged in
	if (!locals.user) throw error(401, 'Unauthorized')

	// 2. Fetch the user's current link status from the DB
	const dbUser = await db.query.user.findFirst({
		where: eq(table.user.id, locals.user.id),
		columns: {
			scratchUsername: true,
			scratchLinked: true,
		},
	})

	// 3. Check if they have an active verification session in cookies
	const sessionUsername = cookies.get('scratch_user')
	const token = cookies.get('scratch_token')
	const comment = cookies.get('scratch_comment')

	let projects = []
	if (dbUser?.scratchLinked && dbUser.scratchUsername) {
		const res = await fetch(`https://api.scratch.mit.edu/users/${dbUser.scratchUsername}/projects`)
		if (res.ok) projects = await res.json()
	}

	return {
		// Data from DB
		isLinked: !!dbUser?.scratchLinked,
		linkedUsername: dbUser?.scratchUsername,

		// State management for the UI
		projects,
		step: sessionUsername ? 2 : 1,
		username: sessionUsername,
		verificationToken: token,
		verificationComment: comment,
	}
}

export const actions: Actions = {
	setup: async ({ request, cookies, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' })

		const formData = await request.formData()
		const username = formData.get('username')?.toString().trim()

		if (!username) return fail(400, { message: 'Username is required' })
		// easter egg
		if (username === 'kaj') {
			return fail(400, {
				message:
					'Guvf vf NzcRyrpgerphgrq fcrnxvat. Fpengpu unf VC onaarq zr... V nz gur arj Xnw. Cyrnfr cerff S gb cnl lbhe erfcrpgf.',
			})
		}

		// 1. Check if this Scratch account is already linked to someone else
		const existingLink = await db.query.user.findFirst({
			where: and(eq(table.user.scratchUsername, username), eq(table.user.scratchLinked, true)),
		})

		if (existingLink) {
			return fail(400, {
				message: `This Scratch account is linked to ${existingLink.username}.`,
			})
		}

		// 2. Check if user is Scratch Team
		const userResponse = await fetch(`https://api.scratch.mit.edu/users/${username}`)
		if (!userResponse.ok) return fail(404, { message: 'Scratch user not found.' })

		const userData = await userResponse.json()
		if (userData.scratchteam === true) {
			return fail(403, {
				message: 'If you are a Scratch Team member, please contact us to link your account.',
			})
		}

		const { token, fullComment } = generateVerificationData()

		cookies.set('scratch_user', username, { path: '/', maxAge: 1800 })
		cookies.set('scratch_token', token, { path: '/', maxAge: 1800 })
		cookies.set('scratch_comment', fullComment, { path: '/', maxAge: 1800 })

		return {
			step: 2,
			username,
			verificationToken: token,
			verificationComment: fullComment,
		}
	},

	verify: async ({ cookies, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' })

		const username = cookies.get('scratch_user')
		const expectedToken = cookies.get('scratch_token')

		if (!username || !expectedToken) {
			return fail(400, { message: 'Session expired. Start over.' })
		}

		try {
			const foundToken = await findVerificationToken(username)

			if (!foundToken || foundToken !== expectedToken) {
				return fail(400, { message: 'Verification failed. Could not find the comment.' })
			}

			// SUCCESS: Update the Database
			await db
				.update(table.user)
				.set({
					scratchUsername: username,
					scratchLinked: true,
				})
				.where(eq(table.user.id, locals.user.id))

			// Clear cookies
			cookies.delete('scratch_user', { path: '/' })
			cookies.delete('scratch_token', { path: '/' })
			cookies.delete('scratch_comment', { path: '/' })

			return { success: true }
		} catch (err) {
			return fail(500, { message: 'Failed to update account in database.' })
		}
	},

	reset: async ({ cookies }) => {
		cookies.delete('scratch_user', { path: '/' })
		cookies.delete('scratch_token', { path: '/' })
		cookies.delete('scratch_comment', { path: '/' })
		return { step: 1 }
	},
}
