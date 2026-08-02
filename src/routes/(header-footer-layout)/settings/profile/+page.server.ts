import { error, fail, type Actions } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	// 1. Ensure the user is logged in
	if (!locals.user) {
		return {}
	}

	// 2. Fetch the user's settings from the DB
	const [userSettings] = await db
		.select({
			isPrivate: table.user.isPrivate,
		})
		.from(table.user)
		.where(eq(table.user.id, locals.user.id))
		.limit(1)

	if (!userSettings) {
		throw error(404, 'User settings not found')
	}

	return {
		settings: userSettings,
	}
}

export const actions: Actions = {
	updateSettings: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		const formData = await request.formData()
		const updates: Partial<typeof table.user.$inferSelect> = {
			isPrivate: false,
		}
		if (Object.keys(updates).length === 0) {
			return fail(400, { message: 'No changes provided' })
		}

		if (formData.has('isPrivate')) {
			updates.isPrivate = formData.has('isPrivate')
		}

		try {
			await db.update(table.user).set(updates).where(eq(table.user.id, locals.user.id))

			return {
				success: true,
				updatedFields: Object.keys(updates),
			}
		} catch (e) {
			return fail(500, { message: 'Internal Server Error saving settings' })
		}
	},
}
