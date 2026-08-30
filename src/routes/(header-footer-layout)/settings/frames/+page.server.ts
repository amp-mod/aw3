import { fail, type Actions } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'
import { failIfCannotPerformAction, canPerformAction } from '$lib/server/permissions'
import { frames } from '$lib/frames'
import { regenerateUserProfileCache } from '$lib/server/auth'

export const actions: Actions = {
	setFrame: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' })
		}

		failIfCannotPerformAction(locals.user, 'setFrame')

		const formData = await request.formData()
		const newFrame = formData.get('frame') === '' ? null : formData.get('frame')

		if (!Object.keys(frames).includes(newFrame) && newFrame !== null) {
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
