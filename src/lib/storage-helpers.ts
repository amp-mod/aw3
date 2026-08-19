import type { User } from './server/db/schema'
import DefaultPFP from '$lib/assets/default-pfp.png'

export const publicUrlRoot = import.meta.env.VITE_AW3_UPLOADS_BASE ?? '/uploads/'
export const getPublicUrl = (path: string) => {
	return `${publicUrlRoot}${path}`
}

/**
 * Returns an object containing URLs for all profile picture sizes.
 * @param user - The user object
 */
export const getPfpPath = (user: User) => {
	const sizes = ['16', '24', '32', '64', 'full'] as const
	if (!user.hasPFP) {
		return Object.fromEntries(sizes.map((s) => [s, DefaultPFP]))
	}
	const base = `aw3-avatars/${user.id}`
	return {
		...Object.fromEntries(sizes.map((s) => [s, getPublicUrl(`${base}_${s}.webp`)])),
	}
}
