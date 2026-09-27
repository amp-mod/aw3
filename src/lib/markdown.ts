import MarkdownIt from 'markdown-it'
import emojiRegex from 'emoji-regex'
import { EMOJI_MAP } from './emojis'

export const md = new MarkdownIt({
	html: false,
	linkify: true,
	typographer: true,
	breaks: true,
})

const unicodeEmojiRegex = emojiRegex()

const FORBIDDEN_EMOJIS = new Set([
	'1f595',
	'1f346',
	'1f351',
	'1f377',
	'1f378',
	'1f37a',
	'1f37b',
	'1f943',
	'1f51e',
	'1f3e9',
	'1f4a6',
])

const HEART_EMOJI = '\u2764\uFE0F'

md.inline.ruler.after('link', 'shorthand', (state, silent) => {
	const pos = state.pos
	const src = state.src

	const char = src[pos].toUpperCase()
	if (char !== 'P' && char !== 'G') return false

	if (src.charCodeAt(pos + 1) !== 0x40) return false

	const tail = src.slice(pos + 2)
	const match = tail.match(/^(\d+)/)
	if (!match) return false

	const id = match[1]
	const type = char === 'P' ? 'projects' : 'studios'
	const label = `${char}@${id}`

	if (!silent) {
		const token_o = state.push('link_open', 'a', 1)
		token_o.attrs = [['href', `/${type}/${id}`]]
		const token_t = state.push('text', '', 0)
		token_t.content = label
		state.push('link_close', 'a', -1)
	}

	state.pos += id.length + 2
	return true
})

md.inline.ruler.after('shorthand', 'custom_emoji', (state, silent) => {
	const pos = state.pos
	const src = state.src

	if (src.charCodeAt(pos) !== 0x3a) return false

	const tail = src.slice(pos + 1)
	const match = tail.match(/^([a-zA-Z0-9_-]+):/)
	if (!match) return false

	const emojiKey = match[1].toLowerCase()
	const emojiSrc = EMOJI_MAP[emojiKey]

	if (!emojiSrc) return false

	if (!silent) {
		const token = state.push('image', 'img', 0)
		token.attrs = [
			['src', emojiSrc],
			['alt', `:${emojiKey}:`],
			['title', `:${emojiKey}:`],
			['class', 'inline-emoji'],
			[
				'style',
				'height: 1em; width: 1em; vertical-align: -0.1em; display: inline-block; margin: 0;',
			],
		]
		token.children = []
	}

	state.pos += emojiKey.length + 2
	return true
})

md.inline.ruler.before('text', 'filter_forbidden_emojis', (state, silent) => {
	const pos = state.pos
	const tail = state.src.slice(pos)

	unicodeEmojiRegex.lastIndex = 0
	const match = unicodeEmojiRegex.exec(tail)

	if (!match || match.index !== 0) return false

	const emoji = match[0]
	const codePointsHex = [...emoji]
		.map((char) => char.codePointAt(0)!.toString(16))
		.filter((c) => c !== 'fe0f')
		.join('-')

	if (!FORBIDDEN_EMOJIS.has(codePointsHex)) return false

	if (!silent) {
		const token = state.push('text', '', 0)
		token.content = HEART_EMOJI
	}

	state.pos += emoji.length
	return true
})

md.inline.ruler.after('custom_emoji', 'mention', (state, silent) => {
	const pos = state.pos
	if (state.src.charCodeAt(pos) !== 0x40) return false

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
