<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import {
		Bold,
		Italic,
		List,
		ListOrdered,
		Heading1,
		Heading2,
		Link as LinkIcon,
		Quote,
		Undo,
		Redo,
		ExternalLink,
		Smile,
	} from '@lucide/svelte'

	import emojiDataRaw from 'unicode-emoji-json'
	import emojiNames from 'unicode-emoji-json/data-by-emoji.json'
	import { markPasteRule } from '@tiptap/core'

	let { value = $bindable(''), class: className = '' } = $props()

	// --- State ---
	let editorElement = $state<HTMLElement>()
	let linkMenuElement = $state<HTMLElement>()
	let emojiMenuElement = $state<HTMLElement>()
	let editor = $state<any>()
	let isLoaded = $state(false)
	let linkUrl = $state('')
	let emojiSearch = $state('')
	let showEmojiMenu = $state(false)

	// --- Emoji Data ---
	// from forumoji source code
	const forbidden = new Set([
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

	const allEmojis = Object.keys(emojiDataRaw)
		.map((char) => ({
			char,
			// Replace spaces with underscores and lowercase the name
			name: (emojiNames[char]?.name || '').toLowerCase().replace(/\s+/g, '_'),
			slug: char.codePointAt(0).toString(16).toLowerCase(),
		}))
		.filter((e) => !forbidden.has(e.slug))

	const filteredEmoji = $derived(
		emojiSearch.trim() === ''
			? []
			: allEmojis.filter((e) => e.name.includes(emojiSearch.toLowerCase())),
	)

	onMount(async () => {
		const { Editor, Extension, Mark } = await import('@tiptap/core')
		const StarterKit = (await import('@tiptap/starter-kit')).default
		const { Markdown } = await import('@tiptap/markdown')
		const { Link } = await import('@tiptap/extension-link')
		const BubbleMenu = (await import('@tiptap/extension-bubble-menu')).BubbleMenu
		const Suggestion = (await import('@tiptap/suggestion')).default
		const tippy = (await import('tippy.js')).default
		const { Plugin, PluginKey } = await import('@tiptap/pm/state')
		const { Decoration, DecorationSet } = await import('@tiptap/pm/view')

		editor = new Editor({
			element: editorElement!,
			extensions: [
				StarterKit.configure({ heading: { levels: [2, 3] } }),
				Markdown,
				Link.configure({
					openOnClick: false,
					HTMLAttributes: { class: 'text-accent underline cursor-pointer' },
				}),
				BubbleMenu.configure({
					pluginKey: 'linkMenu',
					element: linkMenuElement!,
					shouldShow: ({ editor }) => editor.isActive('link'),
				}),
				Extension.create({
					name: 'emojiSuggestion',
					addProseMirrorPlugins() {
						return [
							Suggestion({
								editor: this.editor,
								char: ':',
								allow: ({ state, range }) => {
									const text = state.doc.textBetween(range.from, range.to, ' ')
									return text.length > 1
								},
								command: ({ editor, range, props }) => {
									editor.chain().focus().deleteRange(range).insertContent(props.char).run()
								},
								render: () => {
									let popup: any

									return {
										onStart: (props) => {
											emojiSearch = props.query
											showEmojiMenu = true

											popup = tippy('body', {
												getReferenceClientRect: props.clientRect,
												appendTo: () => document.body,
												content: emojiMenuElement!,
												showOnCreate: true,
												interactive: true,
												trigger: 'manual',
												placement: 'bottom-start',
											})
										},
										onUpdate: (props) => {
											emojiSearch = props.query
											showEmojiMenu = props.query.length > 0
											popup[0].setProps({
												getReferenceClientRect: props.clientRect,
											})
										},
										onKeyDown: (props) => {
											if (
												props.event.key === 'Enter' &&
												showEmojiMenu &&
												filteredEmoji.length > 0
											) {
												selectEmoji(filteredEmoji[0].char)
												return true
											}
											if (props.event.key === 'Escape') {
												popup[0].hide()
												return true
											}
											return false
										},
										onExit: () => {
											popup[0].destroy()
											showEmojiMenu = false
											emojiSearch = ''
										},
									}
								},
							}),
						]
					},
				}),
				Mark.create({
					name: 'mention',
					priority: 101,
					inclusive: false,
					parseHTML() {
						return [{ tag: 'span[data-mention]' }]
					},
					renderHTML() {
						return [
							'span',
							{ class: 'text-accent font-medium underline mention', 'data-mention': '' },
							0,
						]
					},

					// 1. Handle text that is pasted into the editor
					addPasteRules() {
						return [
							markPasteRule({
								find: /(?:^|\s)(@[\w-]+)/g,
								type: this.type,
							}),
						]
					},

					// 2. Handle existing text and "live" typing without requiring a space
					addProseMirrorPlugins() {
						return [
							new Plugin({
								key: new PluginKey('mention-highlighter'),
								props: {
									decorations(state) {
										const decorations: any[] = []
										const regex = /(?:^|\s)(@[\w-]+)/g

										state.doc.descendants((node, pos) => {
											if (!node.isText) return

											let match
											while ((match = regex.exec(node.text!)) !== null) {
												const start = pos + match.index + match[0].indexOf('@')
												const end = start + match[1].trim().length

												decorations.push(
													Decoration.inline(start, end, {
														class: 'text-accent font-medium underline mention',
														'data-mention': 'true',
													}),
												)
											}
										})
										return DecorationSet.create(state.doc, decorations)
									},
								},
							}),
						]
					},
				}),
			],
			content: value,
			editorProps: {
				attributes: {
					class: `prose prose-sm dark:prose-invert focus:outline-none min-h-[180px] p-4 max-w-none ${className}`,
					handleClick: (view, pos, event) => {
						const target = event.target as HTMLElement
						const link = target.closest('a')
						if (link) {
							event.preventDefault()
							return true
						}
						return false
					},
				},
			},
			onUpdate: ({ editor }) => {
				value = editor.getMarkdown()
			},
			onSelectionUpdate: ({ editor }) => {
				linkUrl = editor.getAttributes('link').href || ''
			},
		})
		isLoaded = true
	})

	const selectEmoji = (char: string) => {
		const { state } = editor
		const { $from: fromPos } = state.selection
		const textBefore = fromPos.parent.textBetween(
			Math.max(0, fromPos.parentOffset - 20),
			fromPos.parentOffset,
			undefined,
			'\0',
		)
		const match = textBefore.match(/:(\w*)$/)
		if (match) {
			const deleteRange = { from: fromPos.pos - match[0].length, to: fromPos.pos }
			editor.chain().focus().deleteRange(deleteRange).insertContent(char).run()
		}
		showEmojiMenu = false
	}

	const cmd = (name: string, opts = {}) => editor?.chain().focus()[name](opts).run()
	onDestroy(() => {
		if (editor) editor.destroy()
	})
</script>

<div
	class="relative flex flex-col rounded-xl border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900"
>
	<div
		class="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 p-1.5 dark:border-neutral-700 dark:bg-neutral-800/50"
	>
		<button type="button" onclick={() => cmd('toggleBold')} class="btn-tool"
			><Bold size={16} /></button
		>
		<button type="button" onclick={() => cmd('toggleItalic')} class="btn-tool"
			><Italic size={16} /></button
		>
		<div class="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600"></div>
		<button
			type="button"
			onclick={() => editor.chain().focus().insertContent(':').run()}
			class="btn-tool"><Smile size={16} /></button
		>
		<button
			type="button"
			onclick={() => {
				const url = window.prompt('URL', linkUrl)
				if (url) {
					linkUrl = url
					editor.chain().focus().setLink({ href: url }).run()
				}
			}}
			class="btn-tool"><LinkIcon size={16} /></button
		>
		<div class="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600"></div>
		<button type="button" onclick={() => cmd('toggleHeading', { level: 2 })} class="btn-tool"
			><Heading1 size={16} /></button
		>
		<button type="button" onclick={() => cmd('toggleHeading', { level: 3 })} class="btn-tool"
			><Heading2 size={16} /></button
		>
		<button type="button" onclick={() => cmd('toggleBulletList')} class="btn-tool"
			><List size={16} /></button
		>
		<button type="button" onclick={() => cmd('toggleOrderedList')} class="btn-tool"
			><ListOrdered size={16} /></button
		>
		<button type="button" onclick={() => cmd('toggleBlockquote')} class="btn-tool"
			><Quote size={16} /></button
		>
		<div class="grow"></div>
		<button
			type="button"
			onclick={() => cmd('undo')}
			class="btn-tool"
			disabled={!editor?.can().undo()}><Undo size={16} /></button
		>
		<button
			type="button"
			onclick={() => cmd('redo')}
			class="btn-tool"
			disabled={!editor?.can().redo()}><Redo size={16} /></button
		>
	</div>

	<div class="relative">
		<div
			bind:this={linkMenuElement}
			class="absolute z-50 flex items-center gap-1 rounded-lg border border-neutral-300 bg-white p-1.5 shadow-xl transition-opacity dark:border-neutral-600 dark:bg-neutral-800"
			class:opacity-0={!editor?.isActive('link')}
			class:pointer-events-none={!editor?.isActive('link')}
		>
			<input
				type="text"
				bind:value={linkUrl}
				onchange={() =>
					editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()}
				placeholder="https://..."
				class="w-48 rounded border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono text-xs outline-none focus:ring-1 focus:ring-accent dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
				onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), editor.commands.focus())}
			/>
			<a
				href={linkUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="p-1 text-neutral-500 hover:text-accent"><ExternalLink size={14} /></a
			>
		</div>

		<!-- This element is picked up by Tippy and moved to the body/cursor -->
		<div
			bind:this={emojiMenuElement}
			class="scrollbar-hide z-50 flex max-h-48 w-56 flex-col overflow-y-auto rounded-lg border border-neutral-300 bg-white p-1 shadow-2xl dark:border-neutral-600 dark:bg-neutral-800"
			class:hidden={!showEmojiMenu || filteredEmoji.length === 0}
		>
			{#each filteredEmoji.slice(0, 10) as emoji}
				<button
					type="button"
					class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
					onclick={() => selectEmoji(emoji.char)}
				>
					<span class="text-lg">{emoji.char}</span>
					<span class="truncate text-neutral-600 dark:text-neutral-400">:{emoji.name}:</span>
				</button>
			{/each}
		</div>

		<div bind:this={editorElement}>
			{#if !isLoaded}
				<div
					class="flex h-[200px] items-center justify-center bg-neutral-50 dark:bg-neutral-900/50"
				>
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent"
					></div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	@reference '$lib/../app.css';
	.btn-tool {
		@apply flex h-8 w-8 items-center justify-center rounded text-neutral-600 transition-colors hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700;
	}
	.btn-tool:disabled {
		@apply cursor-not-allowed opacity-30;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	:global(.prose) {
		max-width: 100% !important;
	}
	/* Ensure Tippy container doesn't have default padding if needed */
	:global(.tippy-box) {
		background: transparent !important;
	}
	:global(.tippy-content) {
		padding: 0 !important;
	}
</style>
