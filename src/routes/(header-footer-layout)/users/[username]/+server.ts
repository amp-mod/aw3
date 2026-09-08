import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, params }) => {
	const username = params.username

	if (username) {
		throw redirect(308, `/@${username}`)
	}
}
