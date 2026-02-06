import type { LayoutServerLoad } from './$types'
import { getRequestEvent } from '$app/server'

export const load: LayoutServerLoad = ({ request }) => {
	const user = getRequestEvent().locals.user

	return {
		user,
		isDangerousMode: process.env.AW3_FORCE_ADMIN,
	}
}
