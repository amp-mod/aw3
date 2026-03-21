import { error, fail, type Actions } from '@sveltejs/kit'
import { eq, sql, and } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'
import { Filter } from 'bad-words'
import MarkdownIt from 'markdown-it'
import { storage } from '$lib/storage'
import { getPfpPath } from '$lib/storage-helpers'
import sharp from 'sharp'

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
	const viewer = locals.user
	const viewerRank = viewer?.rank ?? 0
	const isStaffMember = viewerRank >= 2

	const [userProfile] = await db
		.select({
			id: table.user.id,
			username: table.user.username,
			rank: table.user.rank,
			bio: table.user.bio,
			hasPFP: table.user.hasPFP,
			createdAt: table.user.createdAt,
			isPrivate: table.user.isPrivate,
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

	if (!userProfile) throw error(404, { message: 'User not found' })

	if (userProfile.isPrivate && !isStaffMember && userProfile.id !== viewer?.id) {
		return { private: true, userProfile: {} }
	}

	const isOwnProfile = viewer?.id === userProfile.id

	const [followingStatus] = viewer
		? await db
				.select()
				.from(table.follow)
				.where(
					and(eq(table.follow.followerId, viewer.id), eq(table.follow.followingId, userProfile.id)),
				)
		: []

	const [counts] = await db
		.select({
			followers: sql<number>`count(*) filter (where ${table.follow.followingId} = ${userProfile.id})`,
			following: sql<number>`count(*) filter (where ${table.follow.followerId} = ${userProfile.id})`,
		})
		.from(table.follow)

	const followers = await db
		.select({
			username: table.user.username,
			id: table.user.id,
		})
		.from(table.follow)
		.leftJoin(table.user, eq(table.follow.followerId, table.user.id))
		.where(eq(table.follow.followingId, userProfile.id))

	const following = await db
		.select({
			username: table.user.username,
			id: table.user.id,
		})
		.from(table.follow)
		.leftJoin(table.user, eq(table.follow.followingId, table.user.id))
		.where(eq(table.follow.followerId, userProfile.id))

	return {
		userProfile,
		isOwnProfile,
		isPrivate: userProfile.isPrivate,
		isViewerStaff: isStaffMember,
		isFollowing: !!followingStatus,
		followerCount: Number(counts?.followers ?? 0),
		followingCount: Number(counts?.following ?? 0),
		followers,
		following,
	}
}

export const actions: Actions = {
	toggleFollow: async ({ request, locals }) => {
		const viewer = locals.user
		if (!viewer) return fail(401, { message: 'You must be logged in to follow users' })

		const formData = await request.formData()
		const targetUserId = Number(formData.get('targetUserId'))

		if (isNaN(targetUserId)) return fail(400, { message: 'Invalid user ID' })
		if (viewer.id === targetUserId) return fail(400, { message: 'You cannot follow yourself' })

		try {
			const [existingFollow] = await db
				.select()
				.from(table.follow)
				.where(
					and(eq(table.follow.followerId, viewer.id), eq(table.follow.followingId, targetUserId)),
				)

			if (existingFollow) {
				await db
					.delete(table.follow)
					.where(
						and(eq(table.follow.followerId, viewer.id), eq(table.follow.followingId, targetUserId)),
					)
				return { success: true, followed: false }
			} else {
				await db.insert(table.follow).values({
					followerId: viewer.id,
					followingId: targetUserId,
				})

				await db.insert(table.notification).values({
					recipientId: targetUserId,
					issuerId: viewer.id,
					type: 'follow',
				})

				return { success: true, followed: true }
			}
		} catch (e) {
			console.error('Follow Error:', e)
			return fail(500, { message: 'Database error' })
		}
	},

	updatePfp: async ({ request, locals }) => {
		const viewer = locals.user
		if (!viewer) return fail(401, { message: 'Unauthorized' })

		const formData = await request.formData()
		const file = formData.get('avatar') as File
		const targetUserId = Number(formData.get('targetUserId'))

		if (isNaN(targetUserId)) return fail(400, { message: 'Invalid target user' })

		const isOwner = viewer.id === targetUserId
		const isStaff = (viewer.rank ?? 0) >= 2
		if (!isOwner && !isStaff) return fail(403, { message: 'Forbidden' })

		if (!file || file.size === 0) return fail(400, { message: 'No file uploaded' })
		if (!file.type.startsWith('image/')) return fail(400, { message: 'Must be an image' })

		try {
			const buffer = Buffer.from(await file.arrayBuffer())
			const baseDir = `aw3-avatars/${targetUserId}`

			const sizes = [
				{ suffix: '16', dim: 16 },
				{ suffix: '32', dim: 32 },
				{ suffix: '64', dim: 64 },
				{ suffix: 'full', dim: 1024 },
			]
			const metadata = await sharp(buffer).metadata()
			const originalWidth = metadata.width ?? 0
			const originalHeight = metadata.height ?? 0

			// Process all sizes in parallel using Sharp
			await Promise.all(
				sizes.map(async ({ suffix, dim }) => {
					let pipeline = sharp(buffer)

					if (suffix === 'full') {
						if (originalWidth > dim || originalHeight > dim) {
							pipeline = pipeline.resize(dim, dim, { fit: 'inside' })
						}
					} else {
						pipeline = pipeline.resize(dim, dim, {
							fit: 'inside',
							withoutEnlargement: true,
						})
					}

					const processed = await pipeline.png({ quality: 85 }).toBuffer()

					await storage.write(`${baseDir}_${suffix}.png`, processed)
				}),
			)

			await db.update(table.user).set({ hasPFP: true }).where(eq(table.user.id, targetUserId))

			return { success: true }
		} catch (e) {
			console.error('PFP Processing Error:', e)
			return fail(500, { message: 'Internal Server Error processing image' })
		}
	},

	updateBio: async ({ request, locals }) => {
		const viewer = locals.user
		if (!viewer) return fail(401, { message: 'Unauthorized' })

		const formData = await request.formData()
		const newBio = formData.get('bio') as string
		const targetUserId = Number(formData.get('targetUserId'))

		if (isNaN(targetUserId)) return fail(400, { message: 'Invalid target user' })
		if (newBio.length > 2000) return fail(400, { message: 'Bio is too long' })

		const [targetUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.id, targetUserId))
			.limit(1)

		if (!targetUser) return fail(404, { message: 'Target user not found' })

		const isOwner = viewer.id === targetUser.id
		const isOp = (viewer.rank ?? 0) >= 2

		if (!isOwner && !isOp) return fail(403, { message: 'Forbidden' })

		const filter = new Filter()
		if (filter.isProfane(stripMarkdown(newBio)) || filter.isProfane(newBio)) {
			return fail(400, { message: 'Bio contains prohibited language' })
		}

		await db.update(table.user).set({ bio: newBio }).where(eq(table.user.id, targetUserId))

		return { success: true }
	},

	banUser: async ({ request, locals }) => {
		const viewerRank = locals.user?.rank ?? 0
		if (!locals.user || viewerRank < 2) return fail(403, { message: 'Insufficient permissions' })

		const formData = await request.formData()
		const targetUserId = Number(formData.get('targetUserId'))
		const reason = (formData.get('reason') as string) || 'No reason provided'
		const durationHours = formData.get('duration') ? Number(formData.get('duration')) : null

		if (isNaN(targetUserId)) return fail(400, { message: 'Invalid target user' })

		const [targetUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.id, targetUserId))
			.limit(1)

		if (!targetUser) return fail(404, { message: 'User not found' })
		if (viewerRank <= (targetUser.rank ?? 0))
			return fail(403, { message: 'Rank hierarchy violation' })

		let expiryDate: Date | null = null
		if (durationHours === 0) {
			expiryDate = new Date()
		} else if (durationHours && durationHours > 0) {
			expiryDate = new Date()
			expiryDate.setHours(expiryDate.getHours() + durationHours)
		}

		await db
			.update(table.user)
			.set({
				status: durationHours === 0 ? 'normal' : 'banned',
				bannedExpiry: expiryDate,
				banReason: durationHours === 0 ? null : reason,
			})
			.where(eq(table.user.id, targetUserId))

		return { success: true }
	},
}
