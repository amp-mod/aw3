import { hash } from '@node-rs/argon2'
import { fail, redirect } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { Actions, PageServerLoad } from './$types'
import { eq, sql, and, gt } from 'drizzle-orm'
import { isProfane } from '$lib/server/bad-word-checker'
import { generateVerificationData, findVerificationToken } from '$lib/server/scratch-verify'
import {
	validatePassword,
	createNewUser,
	establishSession,
	clearScratchCookies,
} from '$lib/server/signup-tools'
import { isValidUsername } from '$lib/username'

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/')
	}

	const scratchUsername = event.cookies.get('s_reg_user')
	const token = event.cookies.get('s_reg_token')
	const comment = event.cookies.get('s_reg_comment')

	// Capture invite code from ?inv= URL query parameter
	const inviteCode = event.url.searchParams.get('inv') ?? ''

	// Lookup the owner user object by inviteId
	let inviteOwner = null
	if (inviteCode) {
		const owner = await db.query.user.findFirst({
			where: eq(table.user.inviteId, inviteCode),
			columns: {
				id: true,
				username: true,
				hasPFP: true,
			},
		})
		if (owner) {
			inviteOwner = owner
		}
	}

	return {
		isNew: event.locals.isNewAw3,
		scratchStep: scratchUsername ? 2 : 1,
		scratchUsername,
		verificationToken: token,
		verificationComment: comment,
		inviteCode,
		inviteOwner,
	}
}

export const actions: Actions = {
	register: async (event) => {
		const formData = await event.request.formData()
		// Normalize to lowercase immediately
		const username = (formData.get('username') as string)?.toLowerCase().trim() ?? ''
		const password = formData.get('password')
		const inviteCode = (formData.get('inviteCode') as string)?.trim() ?? ''

		if (!isValidUsername(username) || isProfane(username, true)) {
			return fail(400, { message: 'Invalid username' })
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password' })
		}

		if (import.meta.env.TURNSTILE_SECRET_KEY) {
			const turnstileToken = formData.get('turnstileToken')
			const verifyResponse = await fetch(
				'https://challenges.cloudflare.com/turnstile/v0/siteverify',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						secret: import.meta.env.TURNSTILE_SECRET_KEY,
						response: turnstileToken,
					}),
				},
			)
			const outcome = await verifyResponse.json()
			if (!outcome.success) {
				return fail(400, { error: 'CAPTCHA failed' })
			}
		}

		const passwordHash = await hash(password as string, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		})

		try {
			const result = await createNewUser(username, passwordHash, false)
			if ('error' in result) return fail(result.status, { message: result.error })

			if (inviteCode) {
				const inviter = await db.query.user.findFirst({
					where: eq(table.user.inviteId, inviteCode),
					columns: { id: true },
				})
				if (inviter) {
					await db
						.update(table.user)
						.set({ inviter: inviter.id })
						.where(eq(table.user.id, result.newUser.id))

					await db
						.insert(table.follow)
						.values({
							followerId: result.newUser.id,
							followingId: inviter.id,
						})
						.onConflictDoNothing()
				}
			}

			await establishSession(event, result.newUser.id)
		} catch (e) {
			console.error(e)
			return fail(500, { message: 'An error occurred during registration' })
		}

		return redirect(302, '/')
	},

	registerScratch: async ({ request, cookies }) => {
		const formData = await request.formData()
		// Normalize to lowercase immediately
		const username = formData.get('username')?.toString().toLowerCase().trim() ?? ''
		const password = formData.get('password')?.toString() ?? ''
		const inviteCode = formData.get('inviteCode')?.toString().trim() ?? ''

		if (!isValidUsername(username) || isProfane(username, true)) {
			return fail(400, { message: 'Invalid username' })
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password' })
		}

		const existing = await db.query.user.findFirst({
			where: sql`${table.user.username} = ${username} OR ${table.user.scratchUsername} = ${username}`,
		})
		if (existing) return fail(400, { message: 'Username or Scratch account already in use' })

		const res = await fetch(`https://api.scratch.mit.edu/users/${username}`)
		if (!res.ok) return fail(404, { message: 'Scratch user not found' })
		const scratchData = await res.json()
		if (scratchData.scratchteam) {
			return fail(403, { message: 'Scratch Team members must contact support.' })
		}

		const { token, fullComment } = generateVerificationData()
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1,
		})

		const opts = { path: '/', maxAge: 1800, httpOnly: true, secure: true, sameSite: 'lax' as const }
		cookies.set('s_reg_user', username, opts)
		cookies.set('s_reg_token', token, opts)
		cookies.set('s_reg_comment', fullComment, opts)
		cookies.set('s_reg_pw', passwordHash, opts)
		if (inviteCode) {
			cookies.set('s_reg_invite', inviteCode, opts)
		}

		return {
			scratchStep: 2,
			scratchUsername: username,
			verificationToken: token,
			verificationComment: fullComment,
		}
	},

	verifyScratch: async (event) => {
		const { cookies } = event
		const username = cookies.get('s_reg_user') // Already lowercased from Step 1
		const expectedToken = cookies.get('s_reg_token')
		const passwordHash = cookies.get('s_reg_pw')
		const inviteCode = cookies.get('s_reg_invite')

		if (!username || !expectedToken || !passwordHash) {
			return fail(400, { message: 'Session expired. Please start over.' })
		}

		try {
			const foundToken = await findVerificationToken(username)
			if (!foundToken || foundToken !== expectedToken) {
				return fail(400, { message: 'Verification failed. Could not find the comment.' })
			}

			const result = await createNewUser(username, passwordHash, true, inviteCode || undefined)
			if ('error' in result) return fail(result.status, { message: result.error })

			await establishSession(event, result.newUser.id)
			clearScratchCookies(cookies)
			cookies.delete('s_reg_invite', { path: '/' })
		} catch (e) {
			console.error(e)
			return fail(500, { message: 'Finalization failed.' })
		}

		return redirect(302, '/')
	},

	resetScratch: async ({ cookies }) => {
		clearScratchCookies(cookies)
		cookies.delete('s_reg_invite', { path: '/' })
		return { scratchStep: 1 }
	},

	checkUsername: async ({ request }) => {
		const formData = await request.formData()
		const username = (formData.get('username') as string)?.toLowerCase().trim() ?? ''

		if (isProfane(username, true)) {
			return { available: false, message: 'Username is possibly profane.' }
		}
		if (!isValidUsername(username)) {
			return {
				available: false,
				message: 'Usernames must be 3-20 characters (lowercase, numbers, underscores, dashes).',
			}
		}

		const existingUser = await db
			.select({ id: table.user.id })
			.from(table.user)
			.where(eq(table.user.username, username))
			.limit(1)

		if (existingUser.length > 0) {
			return { available: false, message: 'Username taken.' }
		}

		const activeRedirect = await db
			.select({ id: table.userRedirects.id })
			.from(table.userRedirects)
			.where(
				and(
					eq(table.userRedirects.fromUsername, username),
					gt(table.userRedirects.expiresAt, new Date()),
				),
			)
			.limit(1)

		if (activeRedirect.length > 0) {
			return {
				available: false,
				message: 'This username is currently reserved because a user changed their username.',
			}
		}

		return {
			available: true,
			message: '',
		}
	},
}
