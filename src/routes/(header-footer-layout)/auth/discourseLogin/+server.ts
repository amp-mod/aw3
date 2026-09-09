import { redirect, error, type RequestHandler } from '@sveltejs/kit'
import crypto from 'node:crypto'
import { env } from '$env/dynamic/private'
import { ADMINISTRATOR, MODERATOR } from '$lib/ranks'

export const GET: RequestHandler = async ({ url, locals }) => {
	const secret = env.DISCOURSE_SECRET
	if (!secret) {
		throw error(500, 'SSO configuration error: DISCOURSE_SECRET is missing.')
	}

	const sso = url.searchParams.get('sso')
	const sig = url.searchParams.get('sig')

	if (!sso || !sig) {
		throw error(400, 'Missing SSO payload or signature')
	}

	const expectedSig = crypto.createHmac('sha256', secret).update(sso).digest('hex')
	const sigBuffer = Buffer.from(sig, 'hex')
	const expectedSigBuffer = Buffer.from(expectedSig, 'hex')
	if (
		sigBuffer.length !== expectedSigBuffer.length ||
		!crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)
	) {
		throw error(403, 'Invalid signature')
	}

	const user = locals.user
	if (!user) {
		const returnTo = encodeURIComponent(url.pathname + url.search)
		throw redirect(302, `/auth/login-modal?redirect=${returnTo}`)
	}

	// Prevent users banned from AmpMod from logging into the forums.
	// Even though the forums have their own ban system, the TOS states bans on
	// ampmod.org apply to all other AmpMod sites.
	if (user.status === 'banned') {
		throw redirect(302, `/banned`)
	}

	const rawPayload = Buffer.from(sso, 'base64').toString('utf-8')
	const parsedParams = new URLSearchParams(rawPayload)
	const nonce = parsedParams.get('nonce')
	const returnUrl = parsedParams.get('return_sso_url')

	if (!nonce || !returnUrl) {
		throw error(400, 'Invalid payload: missing nonce or return_sso_url')
	}

	const isAdmin = (user.rank ?? 0) >= ADMINISTRATOR
	const isModerator = (user.rank ?? 0) >= MODERATOR

	const responseParams = new URLSearchParams({
		nonce,
		external_id: user.id.toString(),
		email: `${user.id}-no-email@aw3.invalid`,
		username: user.username,
		admin: isAdmin ? 'true' : 'false',
		moderator: isModerator ? 'true' : 'false',
		...(user.hasPFP
			? {
					avatar_url: `https://ampmod.org/uploads/aw3-avatars/${user.id}_full.webp`,
					avatar_force_update: 'true',
				}
			: {}),
	})

	const base64Response = Buffer.from(responseParams.toString()).toString('base64')
	const responseSig = crypto.createHmac('sha256', secret).update(base64Response).digest('hex')

	const redirectTarget = new URL(returnUrl)
	redirectTarget.searchParams.set('sso', base64Response)
	redirectTarget.searchParams.set('sig', responseSig)

	throw redirect(302, redirectTarget.toString())
}
