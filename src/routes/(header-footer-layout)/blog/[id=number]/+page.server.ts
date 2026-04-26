import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params

	const fetchBlogPost = async (postId: string) => {
		try {
			// We include 'user' for the author and 'posts' for the actual content/body
			const res = await fetch(
				`https://ampblog.flarum.cloud/api/discussions/${postId}?include=user,tags,posts`,
			)

			if (!res.ok) {
				if (res.status === 404) error(404, 'Blog post not found')
			}

			const json = await res.json()
			const discussion = json.data
			const included = json.included || []

			// Find the author
			const authorId = discussion.relationships?.user?.data?.id
			const authorData = included.find((inc: any) => inc.type === 'users' && inc.id === authorId)

			// Flarum stores the main post content in the 'posts' relationship.
			// Usually, the first post (index 0) is the discussion body.
			const firstPostId = discussion.relationships?.posts?.data?.[0]?.id
			const firstPostData = included.find(
				(inc: any) => inc.type === 'posts' && inc.id === firstPostId,
			)

			// Get Tag Info
			const tagRelation = discussion.relationships?.tags?.data?.[0]
			const tagData = included.find((inc: any) => inc.type === 'tags' && inc.id === tagRelation?.id)

			return {
				id: discussion.id,
				title: discussion.attributes.title,
				contentHtml: firstPostData?.attributes.contentHtml ?? '',
				createdAt: discussion.attributes.createdAt,
				tag: tagData?.attributes?.name ?? 'General',
				author: {
					username: authorData?.attributes.username ?? 'Newswriters',
					avatarUrl: authorData?.attributes.avatarUrl ?? null,
				},
			}
		} catch (e) {
			console.error('Flarum individual fetch error:', e)
			throw error(500, 'Could not load blog post')
		}
	}

	return {
		post: await fetchBlogPost(id),
	}
}
