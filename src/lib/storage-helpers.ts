import type { User } from './server/db/schema'
import DefaultPFP from '$lib/assets/default-pfp.png'

export const getPublicUrl = (path: string) => {
	return `/uploads/${path}`
}

/**
 * Returns an object containing URLs for all profile picture sizes.
 * @param user - The user object
 */
export const getPfpPath = (user: User) => {
	const base = `aw3-avatars/${user.id}`

	if (!user.hasPFP || user.isPrivate)
		return {
			'16': DefaultPFP,
			'32': DefaultPFP,
			'64': DefaultPFP,
			full: DefaultPFP,
		}

	return {
		'16': getPublicUrl(`${base}_16.webp`),
		'32': getPublicUrl(`${base}_32.webp`),
		'64': getPublicUrl(`${base}_64.webp`),
		full: getPublicUrl(`${base}_full.webp`),
	}
}
