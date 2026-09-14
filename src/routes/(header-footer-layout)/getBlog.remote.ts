import { query } from '$app/server'
import * as v from 'valibot'
import { valkey } from '$lib/server/valkey'

export const getBlog = query(async () => {
	const limit = 20
	const key = 'blog:discussions'
	let items: Array<{
		id: string
		title: string
		link: string
		snippet: string
		createdAt: string
		author: { username: string }
	}> = []

	const cached = await valkey.get(key)
	if (cached) {
		items = JSON.parse(cached)
	} else {
		try {
			const res = await fetch('https://forums.ampmod.org/c/announcements.rss')

			if (res.ok) {
				const xmlText = await res.text()
				const itemRegex = /<item>([\s\S]*?)<\/item>/g
				let match: RegExpExecArray | null

				while ((match = itemRegex.exec(xmlText)) !== null) {
					const itemBlock = match[1]

					const titleMatch = itemBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
					const linkMatch = itemBlock.match(/<link>([\s\S]*?)<\/link>/)
					const descMatch = itemBlock.match(
						/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/,
					)
					const dateMatch = itemBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
					const creatorMatch = itemBlock.match(
						/<dc:creator>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/dc:creator>/,
					)
					const guidMatch = itemBlock.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)

					const rawTitle = titleMatch ? titleMatch[1].trim() : ''
					const link = linkMatch ? linkMatch[1].trim() : ''
					const rawDesc = descMatch ? descMatch[1] : ''

					const cleanDesc = rawDesc
						.replace(/<[^>]*>/g, '')
						.replace(/&nbsp;/g, ' ')
						.replace(/&amp;/g, '&')
						.replace(/&lt;/g, '<')
						.replace(/&gt;/g, '>')
						.replace(/&quot;/g, '"')
						.replace(/&#39;/g, "'")
						.replace(/\s+/g, ' ')
						.trim()

					const snippet = cleanDesc.length > 30 ? cleanDesc.slice(0, 30) + '...' : cleanDesc

					const pubDate = dateMatch
						? new Date(dateMatch[1].trim()).toISOString()
						: new Date().toISOString()
					const author = creatorMatch ? creatorMatch[1].trim() : 'Newswriters'
					const guid = guidMatch ? guidMatch[1].trim() : link

					items.push({
						id: guid,
						title: rawTitle,
						link,
						snippet,
						createdAt: pubDate,
						author: { username: author },
					})
				}

				await valkey.set(key, JSON.stringify(items), 'EX', 900)
			}
		} catch (e) {
			console.error('Discourse RSS fetch error:', e)
		}
	}

	return items
})
