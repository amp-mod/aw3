import { error, redirect } from '@sveltejs/kit'
import { eq, and, gt, sql } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
	const { username } = params

	const [userProfile] = await db
		.select({
			id: table.user.id,
			username: table.user.username,
		})
		.from(table.user)
		.where(sql`LOWER(${table.user.username}) = LOWER(${username})`)
		.limit(1)

	if (!userProfile) {
		throw error(404, { message: 'User not found' })
	}

	if (locals.user?.id && userProfile.id === locals.user.id) {
		throw redirect(302, '/mystuff')
	}

	return {
		userProfile,
	}
}
