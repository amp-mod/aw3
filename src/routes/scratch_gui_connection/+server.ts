import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async (event) => {
	const { locals, cookies } = event

	let csrfToken = cookies.get('AW3_CSRF')

	if (!csrfToken) {
		csrfToken = crypto.randomUUID()
		cookies.set('AW3_CSRF', csrfToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: 60 * 60 * 24,
		})
	}

	return json({
		loggedIn: !!locals.user,
		user: locals.user,
		csrfToken: csrfToken,
	})
}
