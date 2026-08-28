import { fail, redirect } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { eq, asc, desc } from 'drizzle-orm'
import type { PageServerLoad, Actions } from './$types'
import { hash, verify } from '@node-rs/argon2'

export const load: PageServerLoad = async (event) => {
	const userSearch = event.url.searchParams.get('user')?.trim()
	if (userSearch) {
		const user = await db.query.user.findFirst({
			where: eq(table.user.username, userSearch),
		})

		if (!user) {
			return fail(404, { message: 'User not found' })
		}

		return { users: [user], page: 0, totalPages: 0 }
	}
	const page = Number(event.url.searchParams.get('p')) || 1
	const usersPerPage = 20
	const totalUsers = await db.$count(table.user)
	const totalPages = Math.ceil(totalUsers / usersPerPage)
	if (page > totalPages) {
		return redirect(302, `/admin/users`)
	}

	// 2. Fetch all users
	const users = await db
		.select({
			id: table.user.id,
			username: table.user.username,
			rank: table.user.rank,
			createdAt: table.user.createdAt,
			hasPFP: table.user.hasPFP,
		})
		.from(table.user)
		.limit(usersPerPage)
		.offset((page - 1) * usersPerPage)
		.orderBy(desc(table.user.createdAt))

	return { users, page, totalPages }
}

export const actions: Actions = {
	updateRank: async ({ request }) => {
		const formData = await request.formData()
		const userId = formData.get('userId') as string
		const newRank = parseInt(formData.get('rank') as string)

		if (isNaN(newRank) || newRank < 0 || newRank > 3) {
			return fail(400, { message: 'Invalid rank' })
		}

		try {
			await db.update(table.user).set({ rank: newRank }).where(eq(table.user.id, userId))

			return { success: true }
		} catch {
			return fail(500, { message: 'Database update failed' })
		}
	},

	updatePassword: async ({ request, locals }) => {
		// This is mostly copied from user auth settings, but things regarding current
		// passwords are removed.

		if (!locals.session || !locals.user || locals.user.rank < 3) {
			return fail(403, { message: 'Forbidden' })
		}

		const data = await request.formData()
		const newPassword = data.get('newPassword')

		if (typeof newPassword !== 'string') {
			return fail(400, { message: 'Invalid input.' })
		}

		if (newPassword.length < 8) {
			return fail(400, { message: 'Password too short.' })
		}

		try {
			const [currentUser] = await db
				.select()
				.from(table.user)
				.where(eq(table.user.id, data.get('userId')))
				.limit(1)

			if (!currentUser) {
				return fail(404, { message: 'User record not found.' })
			}
			const passwordHash = await hash(newPassword)
			await db.update(table.user).set({ passwordHash }).where(eq(table.user.id, currentUser.id))

			return { passwordSuccess: true }
		} catch (err) {
			console.error('Password update error:', err)
			return fail(500, { message: 'An internal error occurred.' })
		}
	},
}
