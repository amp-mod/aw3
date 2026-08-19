import { NEW_AMPMODDER, AMPMODDER, MODERATOR, ADMINISTRATOR } from '$lib/ranks'
import { fail } from '@sveltejs/kit'
import type { User } from './db/schema'

const rankPerms = Object.freeze({
	// main features that everyone can use
	createProject: NEW_AMPMODDER,
	createGallery: NEW_AMPMODDER,
	renameProject: NEW_AMPMODDER,
	beHostOfAGallery: NEW_AMPMODDER,
	setPFP: NEW_AMPMODDER,
	setBio: NEW_AMPMODDER,
	comment: NEW_AMPMODDER,
	follow: NEW_AMPMODDER,
	rankUp: NEW_AMPMODDER, //note: if this is set to AMPMODDER or higher, ranking up will be IMPOSSIBLE!
	linkScratchAccount: NEW_AMPMODDER,
	importFromScratch: NEW_AMPMODDER,
	shareProject: NEW_AMPMODDER,
	setFeaturedProject: NEW_AMPMODDER,
	setProfileFeaturedProject: NEW_AMPMODDER,
	setProjectDescription: NEW_AMPMODDER,
	connectOAuth: NEW_AMPMODDER,
	createOAuthApp: ADMINISTRATOR, // currently oauth will only be used for logging into Wiki and Forums

	// features that require ranking up
	renameAccount: AMPMODDER,

	// moderation
	report: NEW_AMPMODDER,
	reportStaff: AMPMODDER,
	accessAdminPanel: ADMINISTRATOR,
	banProject: MODERATOR,
	banUser: MODERATOR,
	editOtherUsersProfile: MODERATOR,
	viewPrivateProfiles: MODERATOR,
	seeBanStatus: MODERATOR,
	featureProject: MODERATOR,
	addModNoteToProject: MODERATOR,
})

/**
 * Checks if a user has permission to perform an action.
 * @returns {boolean}
 */
export function canPerformAction(user: User, action: keyof typeof rankPerms) {
	// Banned users cannot perform any action.
	if (user.status === 'banned') {
		return false
	}

	const minimumRank = rankPerms[action] ?? Infinity

	return minimumRank <= (user.rank ?? -1)
}

/**
 * Fail the request if the user is not permitted to perform the action.
 */
export function failIfCannotPerformAction(
	user: User,
	action: keyof typeof rankPerms,
	status = 403,
) {
	if (!canPerformAction(user, action)) {
		return fail(status, { message: 'You do not have permission to perform this action.' })
	}
}
