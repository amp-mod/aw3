// not to be confused with Scratch Link :P

import crypto from 'node:crypto'

const VERIFY_PREFIX =
	'This comment is part of a linking process, you can delete it after verifying. ~ '

/**
 * 1. GENERATOR
 * Generates a verification comment with 24 random bytes encoded in Hex.
 */
export function generateVerificationData() {
	const token = crypto.randomBytes(32).toString('hex')

	return {
		token,
		fullComment: `${VERIFY_PREFIX}${token}`,
	}
}

/**
 * 2. PARSER & VERIFIER
 * Checks page 1, then page 2 if needed.
 * @throws Error on network/fetch failure.
 */
export async function findVerificationToken(username: string): Promise<string | null> {
	for (let page = 1; page <= 2; page++) {
		const token = await fetchAndRegexPage(username, page)
		if (token) return token
	}
	return null
}

/**
 * Internal helper using Regex to parse the Scratch comment HTML.
 */
async function fetchAndRegexPage(username: string, page: number): Promise<string | null> {
	const url = `https://scratch.mit.edu/site-api/comments/user/${username}/?page=${page}`

	const response = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (compatible; ScratchVerificationBot/1.0)',
		},
	})

	if (!response.ok) {
		throw new Error(`Scratch API error on page ${page}: ${response.status} ${response.statusText}`)
	}

	const html = await response.text()

	/**
	 * This Regex finds the comment blocks.
	 * Group 1: The data-comment-user attribute
	 * Group 2: The content of the comment
	 */
	const commentRegex = /data-comment-user="([^"]+)"[\s\S]*?<div class="content">([\s\S]*?)<\/div>/gi

	let match
	while ((match = commentRegex.exec(html)) !== null) {
		const author = match[1]
		// Remove HTML tags (like links), collapse whitespace, and trim
		const content = match[2]
			.replace(/<[^>]*>?/gm, '')
			.replace(/\s+/g, ' ')
			.trim()

		// 1. Check if the author matches (case-insensitive)
		if (author.toLowerCase() === username.toLowerCase()) {
			// 2. Check if the content starts with the specific prefix
			if (content.startsWith(VERIFY_PREFIX)) {
				return content.substring(VERIFY_PREFIX.length).trim()
			}
		}
	}

	return null
}
