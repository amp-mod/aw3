import { error, fail, type Actions } from '@sveltejs/kit'
import { eq, sql, and } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'
import { Filter } from 'bad-words'
import { stripMarkdown } from '$lib/markdown'
import { storage } from '$lib/storage'
import sharp from 'sharp'
import { desc } from 'drizzle-orm'

export const load: PageServerLoad = async ({ params, locals }) => {
	const { username } = params
	const { activeUsers } = locals
	const viewer = locals.user
	const viewerRank = viewer?.rank ?? 0
	const isStaffMember = viewerRank >= 2

	const [userProfile] = await db
		.select({
			id: table.user.id,
			username: table.user.username,
			bio: table.user.bio,
			rank: table.user.rank,
			createdAt: table.user.createdAt,
			hasPFP: table.user.hasPFP,
			isPrivate: table.user.isPrivate,
			featuredProjectId: table.user.featuredProjectId,
			featuredProjectTitleIndex: table.user.featuredProjectTitleIndex,
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

	const isOwnProfile = viewer?.id === userProfile.id

	if (userProfile.isPrivate && !isStaffMember && !isOwnProfile) {
		return { private: true, userProfile: { username: userProfile.username }, projects: [] }
	}

	let featuredProject = null
	if (userProfile.featuredProjectId) {
		const [fp] = await db
			.select({
				id: table.project.id,
				title: table.project.title,
			})
			.from(table.project)
			.where(eq(table.project.id, userProfile.featuredProjectId))
			.limit(1)
		featuredProject = fp
	}

	const projects = await db
		.select({
			id: table.project.id,
			title: table.project.title,
		})
		.from(table.project)
		.where(and(eq(table.project.userId, userProfile.id), eq(table.project.status, 'shared')))
		.orderBy(desc(table.project.createdAt))
		.limit(10)

	let canRankUp = false
	if (isOwnProfile && (userProfile.rank ?? 0) === 0) {
		const projectCountResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(table.project)
			.where(and(eq(table.project.userId, userProfile.id), eq(table.project.status, 'shared')))
		const projectCount = Number(projectCountResult[0]?.count ?? 0)
		const accountAgeDays =
			(Date.now() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24)

		if (accountAgeDays >= 5 && projectCount >= 2) {
			canRankUp = true
		}
	}

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
		.select({ username: table.user.username, id: table.user.id, hasPFP: table.user.hasPFP })
		.from(table.follow)
		.leftJoin(table.user, eq(table.follow.followerId, table.user.id))
		.where(eq(table.follow.followingId, userProfile.id))
		.limit(12)

	const following = await db
		.select({ username: table.user.username, id: table.user.id, hasPFP: table.user.hasPFP })
		.from(table.follow)
		.leftJoin(table.user, eq(table.follow.followingId, table.user.id))
		.where(eq(table.follow.followerId, userProfile.id))
		.limit(12)

	// Don't say "isOnline" on Scratch or you'll get banned!!
	const isOnline = activeUsers.some((i) => i.username === userProfile.username)

	return {
		userProfile,
		isOnline,
		featuredProject,
		isOwnProfile,
		projects,
		canRankUp,
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
	rankUp: async ({ locals }) => {
		const user = locals.user
		if (!user) return fail(401, { message: 'Unauthorized' })
		if ((user.rank ?? 0) !== 0) return fail(400, { message: 'Already ranked up' })

		// Re-verify requirements on server side for security
		const projectCountResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(table.project)
			.where(eq(table.project.userId, user.id))

		const projectCount = Number(projectCountResult[0]?.count ?? 0)
		const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)

		if (accountAgeDays < 5 || projectCount < 2) {
			return fail(400, { message: 'Requirements not met (5 days + 2 projects)' })
		}

		try {
			await db.update(table.user).set({ rank: 1 }).where(eq(table.user.id, user.id))
			return { success: true }
		} catch (e) {
			return fail(500, { message: 'Database error' })
		}
	},

	toggleFollow: async ({ request, locals }) => {
		const viewer = locals.user
		if (!viewer) return fail(401, { message: 'Unauthorized' })
		const formData = await request.formData()
		const targetUserId = Number(formData.get('targetUserId'))
		if (isNaN(targetUserId) || viewer.id === targetUserId)
			return fail(400, { message: 'Invalid action' })

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
			await db.insert(table.follow).values({ followerId: viewer.id, followingId: targetUserId })
			await db
				.insert(table.notification)
				.values({ recipientId: targetUserId, issuerId: viewer.id, type: 'follow' })
			return { success: true, followed: true }
		}
	},

	updatePfp: async ({ request, locals }) => {
		const viewer = locals.user
		if (!viewer) return fail(401, { message: 'Unauthorized' })
		const formData = await request.formData()
		const file = formData.get('avatar') as File
		const targetUserId = Number(formData.get('targetUserId'))
		if (isNaN(targetUserId) || (viewer.id !== targetUserId && (viewer.rank ?? 0) < 2))
			return fail(403, { message: 'Forbidden' })
		if (!file || file.size === 0 || !file.type.startsWith('image/'))
			return fail(400, { message: 'Invalid image' })

		try {
			const buffer = Buffer.from(await file.arrayBuffer())
			const baseDir = `aw3-avatars/${targetUserId}`
			const sizes = [
				{ s: '16', d: 16 },
				{ s: '24', d: 24 },
				{ s: '32', d: 32 },
				{ s: '48', d: 48 },
				{ s: '64', d: 64 },
				{ s: 'full', d: 728 },
			]
			const metadata = await sharp(buffer).metadata()

			await Promise.all(
				sizes.map(async ({ s, d }) => {
					let p = sharp(buffer, { animated: true }).rotate()
					if ((metadata.width ?? 0) > d || (metadata.height ?? 0) > d)
						p = p.resize(d, d, { fit: 'inside' })
					const res = await p
						.webp({ quality: d < 32 ? 30 : d > 64 ? 100 : 85, loop: 0, force: true })
						.toBuffer()
					await storage.write(`${baseDir}_${s}.webp`, res)
				}),
			)
			await db.update(table.user).set({ hasPFP: true }).where(eq(table.user.id, targetUserId))
			return { success: true }
		} catch (e) {
			return fail(500, { message: 'PFP Error' })
		}
	},

	updateBio: async ({ request, locals }) => {
		const viewer = locals.user
		if (!viewer) return fail(401, { message: 'Unauthorized' })
		const formData = await request.formData()
		const newBio = formData.get('bio') as string
		const targetUserId = Number(formData.get('targetUserId'))
		if (isNaN(targetUserId) || newBio.length > 2000) return fail(400, { message: 'Invalid data' })

		const [targetUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.id, targetUserId))
			.limit(1)
		if (!targetUser || (viewer.id !== targetUser.id && (viewer.rank ?? 0) < 2))
			return fail(403, { message: 'Forbidden' })

		const filter = new Filter()
		if (filter.isProfane(stripMarkdown(newBio)) || filter.isProfane(newBio))
			return fail(400, { message: 'Profanity detected' })

		await db.update(table.user).set({ bio: newBio }).where(eq(table.user.id, targetUserId))
		return { success: true }
	},

	banUser: async ({ request, locals }) => {
		const viewerRank = locals.user?.rank ?? 0
		if (!locals.user || viewerRank < 2) return fail(403, { message: 'Insufficient permissions' })
		const formData = await request.formData()
		const targetUserId = Number(formData.get('targetUserId'))
		const reason = (formData.get('reason') as string) || 'No reason provided'
		const rawDuration = formData.get('duration')
		const isPermanent = rawDuration === 'permanent'
		const durationHours = isPermanent ? null : Number(rawDuration)

		const [targetUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.id, targetUserId))
			.limit(1)
		if (!targetUser || viewerRank <= (targetUser.rank ?? 0))
			return fail(403, { message: 'Hierarchy violation' })

		let expiryDate: Date | null = null
		if (isPermanent) expiryDate = null
		else if (durationHours === 0) expiryDate = new Date(0)
		else if (durationHours) {
			expiryDate = new Date()
			expiryDate.setHours(expiryDate.getHours() + durationHours)
		}

		await db
			.update(table.user)
			.set({
				status: durationHours === 0 && !isPermanent ? 'normal' : 'banned',
				bannedExpiry: expiryDate,
				banReason: durationHours === 0 && !isPermanent ? null : reason,
			})
			.where(eq(table.user.id, targetUserId))

		return { success: true }
	},
	featureProject: async ({ request, locals }) => {
		const viewer = locals.user
		if (!viewer) return fail(401, { message: 'Unauthorized' })

		const formData = await request.formData()
		const projectId = formData.get('projectId')
		const titleIndex = formData.get('titleIndex')

		const targetProjectId = projectId ? Number(projectId) : null
		const targetTitleIndex = titleIndex !== null ? Number(titleIndex) : 0

		if (targetProjectId !== null) {
			const [project] = await db
				.select()
				.from(table.project)
				.where(and(eq(table.project.id, targetProjectId), eq(table.project.userId, viewer.id)))
				.limit(1)

			if (!project) return fail(403, { message: 'Project not found' })
		}

		try {
			await db
				.update(table.user)
				.set({
					featuredProjectId: targetProjectId,
					featuredProjectTitleIndex: targetTitleIndex, // Save the index
				})
				.where(eq(table.user.id, viewer.id))

			return { success: true }
		} catch (e) {
			return fail(500, { message: 'Database error' })
		}
	},
}
