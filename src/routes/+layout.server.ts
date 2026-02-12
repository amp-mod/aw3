import type { LayoutServerLoad } from './$types'
import { getRequestEvent } from '$app/server'
import { getPfpPath } from '$lib/storage-helpers'

export const load: LayoutServerLoad = ({ request }) => {
	const user = getRequestEvent().locals.user

	return {
		user,
		userPfp: user ? getPfpPath(user.pfp) : null,
		isDangerousMode: process.env.AW3_FORCE_ADMIN,
	}
}
