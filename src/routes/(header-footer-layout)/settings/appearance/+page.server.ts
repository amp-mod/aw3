import type { PageServerLoad, Actions } from './$types'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { failIfCannotPerformAction, canPerformAction } from '$lib/server/permissions'
import { frames } from '$lib/frames'
import { regenerateUserProfileCache } from '$lib/server/auth'

export const load: PageServerLoad = async ({ locals }) => {
	const canUseFrames = canPerformAction(locals.user, 'setFrame')

	return {
		user: locals.user,
		canUseFrames,
	}
}

export const actions: Actions = {
	updateAppearance: async ({ request, locals }) => {
		if (!locals.user) {
			throw error(401, 'Unauthorized')
		}

		const formData = await request.formData()
		const accentColour = formData.get('accentColour')?.toString()

		if (!accentColour || !/^#[0-9A-Fa-f]{6}$/.test(accentColour)) {
			return fail(400, {
				error: 'Invalid hex color format.',
			})
		}

		try {
			await db.update(table.user).set({ accentColour }).where(eq(table.user.id, locals.user.id))

			regenerateUserProfileCache(locals.user.id)

			return { success: true }
		} catch (e) {
			console.error('Failed to update accent colour:', e)
			return fail(500, {
				error: 'An error occurred while saving your settings.',
			})
		}
	},

	setFrame: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		failIfCannotPerformAction(locals.user, 'setFrame')

		const formData = await request.formData()
		const rawFrame = formData.get('frame')
		const newFrame = rawFrame === '' || rawFrame === null ? null : rawFrame.toString()

		if (newFrame !== null && !Object.keys(frames).includes(newFrame)) {
			return fail(400, { message: 'Invalid frame name' })
		}

		try {
			await db.update(table.user).set({ frame: newFrame }).where(eq(table.user.id, locals.user.id))
		} catch (e) {
			console.error(e)
			return fail(500, { message: 'Failed to update frame.' })
		}

		regenerateUserProfileCache(locals.user.id)

		return {
			success: true,
			newFrame,
		}
	},
}
