export interface NormalizeOptions {
	removeDots?: boolean
	removePlus?: boolean
}

export function isValidEmail(email: string): boolean {
	if (!email || typeof email !== 'string') return false
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
	return emailRegex.test(email.trim())
}

export function normalizeEmail(
	email: string,
	options: NormalizeOptions = { removeDots: true, removePlus: true },
): string {
	if (!isValidEmail(email)) {
		throw new Error('Invalid email address provided for normalization.')
	}

	const trimmed = email.trim().toLowerCase()
	const [localPart, domain] = trimmed.split('@')
	let processedLocal = localPart

	const isGoogleDomain = domain === 'gmail.com' || domain === 'googlemail.com'

	if (isGoogleDomain) {
		if (options.removePlus) {
			processedLocal = processedLocal.split('+')[0]
		}
		if (options.removeDots) {
			processedLocal = processedLocal.replace(/\./g, '')
		}
	}

	return `${processedLocal}@${domain}`
}
