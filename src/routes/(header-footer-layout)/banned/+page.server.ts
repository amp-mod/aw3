import { redirect } from '@sveltejs/kit'
import { eq, and, lte, isNotNull } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/')
	}

	const userId = locals.user.id

	const [user] = await db
		.select({
			status: table.user.status,
			bannedExpiry: table.user.bannedExpiry,
			banReason: table.user.banReason,
		})
		.from(table.user)
		.where(eq(table.user.id, userId))
		.limit(1)

	if (!user || user.status !== 'banned') {
		redirect(302, '/')
	}

	const now = new Date()
	if (user.bannedExpiry && user.bannedExpiry <= now) {
		await db
			.update(table.user)
			.set({
				status: 'normal',
				bannedExpiry: null,
				banReason: null,
			})
			.where(eq(table.user.id, userId))

		redirect(302, '/')
	}
}
