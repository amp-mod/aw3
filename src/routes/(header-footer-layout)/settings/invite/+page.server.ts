import { redirect } from '@sveltejs/kit'
import { eq, and, lte, isNotNull } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user.id

	if (!locals.user.isEmailVerified) return { canInvite: false }

	const [user] = await db
		.select({
			inviteId: table.user.inviteId,
		})
		.from(table.user)
		.where(eq(table.user.id, userId))
		.limit(1)

	return { canInvite: false, inviteId: user.inviteId }
}
