import { getRequestEvent } from '$app/server'
import { error } from '@sveltejs/kit'

export function load() {
	const user = getRequestEvent().locals.user
	if (!user || user.rank !== 3) {
		throw error(404)
	}
}
