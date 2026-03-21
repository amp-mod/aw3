import type { LayoutServerLoad } from './$types'
import { getRequestEvent } from '$app/server'

export const load: LayoutServerLoad = ({ request }) => {
	const { locals } = getRequestEvent()
	const { user, sessionDeleted } = locals

	return {
		user,
		isDangerousMode: process.env.AW3_FORCE_ADMIN,
		sessionDeleted,
	}
}
