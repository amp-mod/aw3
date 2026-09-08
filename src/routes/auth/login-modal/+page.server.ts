import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getRequestEvent } from '$app/server'

export const load: PageServerLoad = async () => {
	const { locals, url } = getRequestEvent()

	if (locals.user) {
		return redirect(302, url.searchParams.get('return') || '/')
	}

	return
}
