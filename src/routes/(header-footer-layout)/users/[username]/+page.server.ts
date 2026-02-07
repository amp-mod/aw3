import { error, fail, isHttpError, type Actions } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'
import { Filter } from 'bad-words'
import MarkdownIt from 'markdown-it'
import { storage } from '$lib/storage'
import { getPfpPath } from '$lib/storage-helpers'

/**
 * Utility to strip Markdown for profanity checking
 */
function stripMarkdown(text: string): string {
	const md = new MarkdownIt()
	const tokens = md.parse(text, {})
	let plainText = ''

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
			pfp: table.user.pfp,
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
		throw error(404, { message: 'User not found' })
	}

	const isOwnProfile = locals.user?.id === userProfile.id

	return {
		userProfile: {
			...userProfile,
			pfp: getPfpPath(userProfile.pfp),
		},
		isOwnProfile,
		isViewerStaff: isStaffMember,
	}
}

export const actions: Actions = {
	updatePfp: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthorized' })

		const formData = await request.formData()
		const file = formData.get('avatar') as File
		const targetUserId = formData.get('targetUserId') as string

		const isOwner = locals.user.id === targetUserId
		const isStaff = (locals.user.rank ?? 0) >= 2
		if (!isOwner && !isStaff) return fail(403, { message: 'Forbidden' })

		if (!file || file.size === 0) return fail(400, { message: 'No file uploaded' })
		if (file.size > 720 * 1024) return fail(400, { message: 'File too large (Max 720KB)' })
		if (!file.type.startsWith('image/')) return fail(400, { message: 'Must be an image' })

		try {
			const buffer = Buffer.from(await file.arrayBuffer())
			const ext = file.name.split('.').pop() || 'png'

			const storagePath = `aw3-avatars/${targetUserId}_${Date.now()}.${ext}`

			await storage.write(storagePath, buffer)

			await db.update(table.user).set({ pfp: storagePath }).where(eq(table.user.id, targetUserId))

			return { success: true }
		} catch (e) {
			console.error('PFP Upload Error:', e)
			return fail(500, { message: 'Internal Server Error saving file' })
		}
	},

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

		const filter = new Filter()
		filter.addWords('naughtywordfortestingeventhoughthislongwordisnotbad')
		filter.removeWords('crap', 'heck', 'dang')

		if (filter.isProfane(stripMarkdown(newBio)) || filter.isProfane(newBio)) {
			return fail(400, { message: 'Bio contains prohibited language' })
		}

		await db.update(table.user).set({ bio: newBio }).where(eq(table.user.id, targetUserId))

		return { success: true }
	},

	banUser: async ({ request, locals }) => {
		const viewerRank = locals.user?.rank ?? 0

		if (!locals.user || viewerRank < 2) {
			return fail(403, { message: 'Insufficient permissions' })
		}

		const formData = await request.formData()
		const targetUserId = formData.get('userId') as string
		const reason = (formData.get('reason') as string) || 'No reason provided'
		const durationHours = formData.get('duration') ? Number(formData.get('duration')) : null

		const [targetUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.id, targetUserId))
			.limit(1)

		if (!targetUser) {
			return fail(404, { message: 'User not found' })
		}

		if (viewerRank <= (targetUser.rank ?? 0)) {
			return fail(403, { message: 'You cannot ban a user with an equal or higher rank' })
		}

		let expiryDate: Date | null = null
		if (durationHours && durationHours > 0) {
			expiryDate = new Date()
			expiryDate.setHours(expiryDate.getHours() + durationHours)
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
