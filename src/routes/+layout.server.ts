import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import bannedPermittedPaths from '$lib/banned-permitted-paths'

export const load: LayoutServerLoad = ({ locals, url, depends }) => {
	depends('aw3:sessions')
	const { user, sessionDeleted } = locals
	const isPermittedPath = bannedPermittedPaths.includes(url.pathname)
	if (user?.status === 'banned' && !isPermittedPath) {
		redirect(307, '/banned')
		return {}
	}

	return {
		user,
		isDangerousMode: process.env.AW3_FORCE_ADMIN,
		sessionDeleted,
	}
}
