import MarkdownIt from 'markdown-it'
import AppleCat from '$lib/assets/apple-cat.svg'

export const md = new MarkdownIt({
	html: false,
	linkify: true,
	typographer: true,
})

// --- Shorthand Links (P@123 and G@123) ---
md.inline.ruler.after('link', 'shorthand', (state, silent) => {
	const pos = state.pos
	const src = state.src

	// 1. Check for P or G (case insensitive)
	const char = src[pos].toUpperCase()
	if (char !== 'P' && char !== 'G') return false

	// 2. Check for @ (0x40) instead of #
	if (src.charCodeAt(pos + 1) !== 0x40) return false

	const tail = src.slice(pos + 2)
	const match = tail.match(/^(\d+)/)
	if (!match) return false

	const id = match[1]
	const type = char === 'P' ? 'projects' : 'galleries'

	// 3. Update the label to reflect the @ symbol
	const label = `${char}@${id}`

	if (!silent) {
		const token_o = state.push('link_open', 'a', 1)
		token_o.attrs = [['href', `/${type}/${id}`]]
		const token_t = state.push('text', '', 0)
		token_t.content = label
		state.push('link_close', 'a', -1)
	}

	// 4. Move position forward by id length + the 2 prefix chars (P@)
	state.pos += id.length + 2
	return true
})
// --- Mentions (@username) ---
md.inline.ruler.after('shorthand', 'mention', (state, silent) => {
	const pos = state.pos
	if (state.src.charCodeAt(pos) !== 0x40 /* @ */) return false

	if (pos > 0 && !/\s/.test(state.src[pos - 1])) {
		return false
	}

	const tail = state.src.slice(pos + 1)
	const match = tail.match(/^(\w+)/)
	if (!match) return false

	const username = match[1]
	if (!silent) {
		const token_o = state.push('link_open', 'a', 1)
		token_o.attrs = [['href', `/users/${username}`]]
		const token_t = state.push('text', '', 0)
		token_t.content = `@${username}`
		state.push('link_close', 'a', -1)
	}
	state.pos += username.length + 1
	return true
})

/**
 * Removes markdown formatting to return raw text content.
 */
export function stripMarkdown(text: string): string {
	if (!text) return ''
	const tokens = md.parse(text, {})
	let plainText = ''
	const extractText = (tokens: any[]) => {
		tokens.forEach((token) => {
			if (token.type === 'text' || token.type === 'code_inline') plainText += token.content
			if (token.children) extractText(token.children)
		})
	}
	extractText(tokens)
	return plainText
}
