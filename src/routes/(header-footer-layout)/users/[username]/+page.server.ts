import { error, fail, type Actions } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import type { PageServerLoad } from './$types'
import { Filter } from 'bad-words'
import MarkdownIt from 'markdown-it'

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

	const [userProfile] = await db
		.select({
			id: table.user.id,
			username: table.user.username,
			rank: table.user.rank,
			bio: table.user.bio,
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
	}
}

export const actions: Actions = {
	updateBio: async ({ request, locals }) => {
		// 1. Authentication check
		if (!locals.user || !locals.session) {
			return fail(401, { message: 'Unauthorized' })
		}

		const formData = await request.formData()
		const newBio = formData.get('bio') as string
		const targetUserId = formData.get('targetUserId') as string

		// Optional: Add bio length validation
		if (newBio.length > 500) {
			return fail(400, { message: 'Bio is too long' })
		}

		// 2. Fetch the target user to check permissions
		const [targetUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.id, targetUserId))
			.limit(1)

		if (!targetUser) {
			return fail(404, { message: 'Target user not found' })
		}

		// 3. Authorization check: (User owns profile) OR (User rank >= 3)
		const isOwner = locals.user.id === targetUser.id
		const isOp = (locals.user.rank ?? 0) >= 3

		if (!isOwner && !isOp) {
			return fail(403, { message: 'You do not have permission to edit this bio' })
		}

		// bad word filter [obv !!!]

		const filter = new Filter()
		// test word
		filter.addWords('naughtywordfortestingeventhoughthislongwordisnotbad')
		// mild swears that are considered somewhat acceptable
		filter.removeWords('crap', 'hell', 'damn')
		if (filter.isProfane(stripMarkdown(newBio))) {
			return fail(400, { message: 'Bio is naughty' })
		}
		// also just in case
		if (filter.isProfane(newBio)) {
			return fail(400, { message: 'Bio is naughty' })
		}

		// 4. Perform the update
		await db.update(table.user).set({ bio: newBio }).where(eq(table.user.id, targetUserId))

		return { success: true }
	},
}
