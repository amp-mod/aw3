import { error, fail, type Actions } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'
import { Filter } from 'bad-words'
import MarkdownIt from 'markdown-it'

/**
 * Utility to strip Markdown for profanity checking
 */
function stripMarkdown(text: string): string {
	const md = new MarkdownIt()
	const tokens = md.parse(text, {})
	let plainText = ''

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const extractText = (tokens: any[]) => {
		tokens.forEach((token) => {
			if (token.type === 'text' || token.type === 'code_inline') {
				plainText += token.content
			}
			if (token.children) {
				extractText(token.children)
			}
		})
	}

	extractText(tokens)
	return plainText
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { username } = params
	const viewerRank = locals.user?.rank ?? 0
	const isStaffMember = viewerRank >= 2

	const [userProfile] = await db
		.select({
			id: table.user.id,
			username: table.user.username,
			rank: table.user.rank,
			bio: table.user.bio,
			createdAt: table.user.createdAt,
			...(isStaffMember
				? {
						status: table.user.status,
						bannedExpiry: table.user.bannedExpiry,
						banReason: table.user.banReason,
					}
				: {}),
		})
		.from(table.user)
		.where(eq(table.user.username, username))
		.limit(1)

	if (!userProfile) {
		error(404, { message: 'User not found' })
	}

	const isOwnProfile = locals.user?.id === userProfile.id

	return {
		userProfile,
		isOwnProfile,
		isViewerStaff: isStaffMember,
	}
}

export const actions: Actions = {
	/**
	 * Updates a user's bio.
	 * Allows users to edit their own bio, or staff to edit any bio.
	 */
	updateBio: async ({ request, locals }) => {
		if (!locals.user || !locals.session) {
			return fail(401, { message: 'Unauthorized' })
		}

		const formData = await request.formData()
		const newBio = formData.get('bio') as string
		const targetUserId = formData.get('targetUserId') as string

		if (newBio.length > 2000) {
			return fail(400, { message: 'Bio is too long' })
		}

		const [targetUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.id, targetUserId))
			.limit(1)

		if (!targetUser) {
			return fail(404, { message: 'Target user not found' })
		}

		const isOwner = locals.user.id === targetUser.id
		const isOp = (locals.user.rank ?? 0) >= 2

		if (!isOwner && !isOp) {
			return fail(403, { message: 'You do not have permission to edit this bio' })
		}

		// Profanity Filter
		const filter = new Filter()
		filter.addWords('naughtywordfortestingeventhoughthislongwordisnotbad')
		filter.removeWords('crap', 'heck', 'dang')

		if (filter.isProfane(stripMarkdown(newBio)) || filter.isProfane(newBio)) {
			return fail(400, { message: 'Bio contains prohibited language' })
		}

		await db.update(table.user).set({ bio: newBio }).where(eq(table.user.id, targetUserId))

		return { success: true }
	},

	/**
	 * Bans a user.
	 * Only accessible by staff (rank >= 2).
	 * Prevents banning users of equal or higher rank.
	 */
	banUser: async ({ request, locals }) => {
		const viewerRank = locals.user?.rank ?? 0

		if (!locals.user || viewerRank < 2) {
			return fail(403, { message: 'Insufficient permissions' })
		}

		const formData = await request.formData()
		const targetUserId = formData.get('userId') as string
		const reason = (formData.get('reason') as string) || 'No reason provided'
		const durationHours = formData.get('duration') ? Number(formData.get('duration')) : null // null = permanent

		const [targetUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.id, targetUserId))
			.limit(1)

		if (!targetUser) {
			return fail(404, { message: 'User not found' })
		}

		// Hierarchy Check: Cannot ban equal or higher ranks
		if (viewerRank <= (targetUser.rank ?? 0)) {
			return fail(403, { message: 'You cannot ban a user with an equal or higher rank' })
		}

		let expiryDate: Date | null = null
		if (durationHours && durationHours > 0) {
			expiryDate = new Date()
			expiryDate.setMilliseconds(expiryDate.getMilliseconds() + durationHours)
		}

		await db
			.update(table.user)
			.set({
				status: 'banned',
				bannedExpiry: expiryDate,
				banReason: reason,
			})
			.where(eq(table.user.id, targetUserId))

		return { success: true }
	},
}
