export function isValidUsername(username: string) {
	// must be 3-20 chars
	if (username.length < 3 || username.length > 20) return false

	// wiki compatibility
	if (username.startsWith('_')) return false
	if (username.endsWith('_')) return false
	if (/[_]{2,}/.test(username)) return false

	// only allow certain characters
	return /^[A-Za-z0-9\-_]+$/.test(username)
}
