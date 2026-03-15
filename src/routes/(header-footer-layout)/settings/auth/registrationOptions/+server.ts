import { json, error } from '@sveltejs/kit'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals, cookies, url }) => {
	const user = locals.user
	if (!user) throw error(401, 'Unauthorized')

	/**
	 * WebAuthn rpID must be the domain without protocol or port.
	 * SvelteKit's url.hostname gives exactly this (e.g., 'localhost' or 'myapp.com').
	 */
	const RP_ID = url.hostname
	const RP_NAME = 'AmpMod'

	// Get existing credentials to prevent the same key being registered twice
	const excludeCredentials =
		user.passkeys?.map((key) => ({
			id: key.id, // Ensure this is a Base64URL string
			type: 'public-key' as const,
			transports: key.transports,
		})) || []

	const options = await generateRegistrationOptions({
		rpName: RP_NAME,
		rpID: RP_ID,
		userID: Buffer.from(user.id.toString()),
		userName: user.username,
		userDisplayName: user.username,
		attestationType: 'none',
		excludeCredentials,
		authenticatorSelection: {
			// "required" is essential for "Passkey" behavior (discoverable credentials)
			residentKey: 'required',
			userVerification: 'preferred',
		},
	})

	// Save the challenge in a secure cookie for the verification step
	cookies.set('registration_challenge', options.challenge, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:', // Only require secure in production
		sameSite: 'strict',
		maxAge: 60 * 5,
	})

	return json(options)
}
