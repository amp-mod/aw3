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
	} from '@lucide/svelte'

	let {
		value = $bindable(''),
		placeholder = 'Write something...',
		class: className = '',
	} = $props()

	let editorElement = $state<HTMLElement>()
	let bubbleMenuElement = $state<HTMLElement>() // State for the bubble menu
	let editor = $state<any>()
	let isLoaded = $state(false)
	let linkUrl = $state('') // State for the input URL

	onMount(async () => {
		const { Editor } = await import('@tiptap/core')
		const StarterKit = (await import('@tiptap/starter-kit')).default
		const Markdown = (await import('@tiptap/markdown')).Markdown
		const Link = (await import('@tiptap/extension-link')).Link
		const Placeholder = (await import('@tiptap/extension-placeholder')).default
		const BubbleMenu = (await import('@tiptap/extension-bubble-menu')).BubbleMenu

		editor = new Editor({
			element: editorElement!,
			extensions: [
				StarterKit.configure({
					heading: { levels: [1, 2, 3] },
				}),
				Markdown,
				Link.configure({
					openOnClick: false,
					autolink: true,
					HTMLAttributes: { class: 'text-accent underline cursor-pointer' },
				}),
				// Placeholder.configure({ placeholder }),
				BubbleMenu.configure({
					element: bubbleMenuElement!,
					shouldShow: ({ editor }) => editor.isActive('link'),
				}),
			],
			content: value,
			contentType: 'markdown',
			editorProps: {
				attributes: {
					class: `prose prose-sm dark:prose-invert focus:outline-none min-h-[200px] p-4 max-w-none ${className}`,
				},
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
			onUpdate: ({ editor }) => {
				value = editor.getMarkdown()
			},
			onSelectionUpdate: ({ editor }) => {
				linkUrl = editor.getAttributes('link').href || ''
			},
		})

		isLoaded = true
	})

	onDestroy(() => {
		if (editor) editor.destroy()
	})

	const cmd = (name: string, opts = {}) => {
		editor?.chain().focus()[name](opts).run()
	}

	const saveLink = () => {
		if (linkUrl) {
			editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
		} else {
			editor.chain().focus().unsetLink().run()
		}
	}
</script>

<div
	class="flex flex-col overflow-hidden rounded-xl border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900"
>
	<div
		class="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 p-1.5 dark:border-neutral-700 dark:bg-neutral-800/50"
	>
		<button type="button" onclick={() => cmd('toggleBold')} class="btn-tool">
			<Bold size={16} />
		</button>
		<button type="button" onclick={() => cmd('toggleItalic')} class="btn-tool">
			<Italic size={16} />
		</button>

		<div class="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600"></div>

		<button
			type="button"
			onclick={() => {
				const url = window.prompt('Enter URL', linkUrl)
				if (url !== null) {
					linkUrl = url
					saveLink()
				}
			}}
			class="btn-tool"
		>
			<LinkIcon size={16} />
		</button>

		<button type="button" onclick={() => cmd('toggleHeading', { level: 2 })} class="btn-tool">
			<Heading1 size={16} />
		</button>
		<button type="button" onclick={() => cmd('toggleHeading', { level: 3 })} class="btn-tool">
			<Heading2 size={16} />
		</button>

		<div class="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-600"></div>

		<button type="button" onclick={() => cmd('toggleBulletList')} class="btn-tool">
			<List size={16} />
		</button>
		<button type="button" onclick={() => cmd('toggleOrderedList')} class="btn-tool">
			<ListOrdered size={16} />
		</button>
		<button type="button" onclick={() => cmd('toggleBlockquote')} class="btn-tool">
			<Quote size={16} />
		</button>

		<div class="grow"></div>

		<button
			type="button"
			onclick={() => cmd('undo')}
			class="btn-tool"
			disabled={!editor?.can().undo()}
		>
			<Undo size={16} />
		</button>
		<button
			type="button"
			onclick={() => cmd('redo')}
			class="btn-tool"
			disabled={!editor?.can().redo()}
		>
			<Redo size={16} />
		</button>
	</div>

	<div class="relative bg-transparent">
		<div
			bind:this={bubbleMenuElement}
			class="absolute z-50 flex items-center gap-1 rounded border border-neutral-300 bg-white p-1.5 opacity-0 transition-opacity dark:border-neutral-600 dark:bg-neutral-800"
			class:opacity-0={!editor?.isActive('link')}
		>
			<input
				type="text"
				bind:value={linkUrl}
				onchange={saveLink}
				placeholder="https://..."
				class="w-48 rounded border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono text-xs outline-none focus:ring-1 focus:ring-accent dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
				onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), saveLink())}
			/>
			<a
				href={linkUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="p-1 text-neutral-500 hover:text-accent"
				title="Open link"
			>
				<ExternalLink size={14} />
			</a>
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
		@apply flex h-8 w-8 items-center justify-center rounded transition-colors;
		@apply text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900;
		@apply dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white;
	}
	.btn-tool:disabled {
		@apply cursor-not-allowed opacity-30;
	}
</style>
