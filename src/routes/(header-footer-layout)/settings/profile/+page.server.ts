import { error, fail, type Actions } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'
import { validateUsername } from '$lib/server/signup-tools'
import { failIfCannotPerformAction, canPerformAction } from '$lib/server/permissions'
import { isProfane } from '$lib/server/bad-word-checker'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {}
	}

	const [userSettings] = await db
		.select({
			isPrivate: table.user.isPrivate,
		})
		.from(table.user)
		.where(eq(table.user.id, locals.user.id))
		.limit(1)

	const availableSettings = ['privateAccount']
	if (canPerformAction(locals.user, 'renameAccount')) {
		availableSettings.push('username')
	}

	return {
		settings: userSettings,
		availableSettings,
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
	updateUsername: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		failIfCannotPerformAction(locals.user, 'renameAccount')

		const formData = await request.formData()
		const newUsername = formData.get('username')?.toString().toLowerCase()

		if (!newUsername || !validateUsername(newUsername) || isProfane(newUsername, true)) {
			return fail(400, { message: 'Your new username is invalid' })
		}

		try {
			await db
				.update(table.user)
				.set({ username: newUsername })
				.where(eq(table.user.id, locals.user.id))
		} catch (e) {
			console.error(e)
			return fail(500, { message: 'Failed to update username. It may already be taken.' })
		}

		return {
			success: true,
			newUsername,
		}
	},
}
