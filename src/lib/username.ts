/**
 * A more detailed username check.
 */
export function checkUsername(username: string) {
	// must be 3-20 chars
	if (username.length < 3 || username.length > 20)
		return {
			available: false,
			reason: 'Username must be between 3-20 characters.',
		}

	// wiki compatibility
	if (username.startsWith('_') || username.endsWith('_'))
		return {
			available: false,
			reason: 'Username must not start or end with an underscore.',
		}
	if (/[_]{2,}/.test(username))
		return {
			available: false,
			reason: 'Username must not contain consecutive underscores.',
		}

	// "player####" usernames are reserved for anonymous users using cloud vars
	if (/^player[0-9]{4}$/i.test(username))
		return {
			available: false,
			reason: 'Username must not be in the player#### format.',
		}

	// only allow certain characters
	if (!/^[A-Za-z0-9\-_]+$/.test(username))
		return {
			available: false,
			reason: 'Username must only contain letters, numbers, hyphens and underscores.',
		}

	return {
		available: true,
		reason: '',
	}
}

/**
 * Just gets a boolean.
 */
export function isValidUsername(username: string) {
	return checkUsername(username).available
}
