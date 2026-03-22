import type { LayoutServerLoad } from './$types'
import { getRequestEvent } from '$app/server'
import { redirect } from '@sveltejs/kit'

export const load: LayoutServerLoad = () => {
	const { user } = getRequestEvent().locals
	if (user?.status === 'banned') redirect(307, '/banned')
}
