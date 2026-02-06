import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getRequestEvent } from '$app/server'

export const load: PageServerLoad = async () => {
	const user = requireLogin()
	return { user }
}

function requireLogin() {
	const { locals } = getRequestEvent()

	if (!locals.user) {
		return redirect(302, '/settings/theme')
	} else {
		return redirect(302, '/settings/profile')
	}

	return locals.user
}
