<script lang="ts">
	import { onDestroy } from 'svelte'
	import {
		UserRound,
		Pencil,
		FolderOpen,
		Bold,
		Italic,
		List,
		ShieldAlert,
		Gavel,
		X,
		Heading as HeadingIcon,
		ChevronDown,
		Save,
		Camera,
		Loader2,
		Loader,
	} from '@lucide/svelte'
	import { DropdownMenu } from 'bits-ui'
	import { enhance } from '$app/forms'
	import { rankMap, isStaff } from '$lib/ranks'
	import MarkdownIt from 'markdown-it'
	import { type Editor } from '@tiptap/core'
	import { getPfpPath } from '$lib/storage-helpers'

	let { data, form } = $props()
	let userProfile = $state(data.userProfile)
	const { isOwnProfile, isViewerStaff } = data

	const md = new MarkdownIt({
		html: false,
		linkify: true,
		typographer: true,
		breaks: true,
	})

	const joinedDate = userProfile.createdAt
		? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})
		: 'Unknown'

	// State for Bio Editing
	const viewerIsOp = isStaff(data.user?.rank)
	const canEdit = isOwnProfile || viewerIsOp
	let isEditingBio = $state(false)
	let editedBio = $state(userProfile.bio ?? '')
	let editorElement: HTMLElement | undefined = $state()
	let editor: Editor | undefined = $state()

	// State for PFP
	let isUploadingPfp = $state(false)
	let pfpInput: HTMLInputElement | undefined = $state()

	// State for Moderation
	let isBanModalOpen = $state(false)
	let userStatus = $state(userProfile.status)

	// Lazy load Tiptap
	$effect(() => {
		if (isEditingBio && editorElement && !editor) {
			const initEditor = async () => {
				const { Editor } = await import('@tiptap/core')
				const { default: StarterKit } = await import('@tiptap/starter-kit')
				const { Markdown } = await import('@tiptap/markdown')

				editor = new Editor({
					element: editorElement!,
					extensions: [StarterKit, Markdown],
					content: editedBio,
					contentType: 'markdown',
					editorProps: {
						transformPastedText(text) {
							return text.replace(/\u00A0/g, ' ')
						},
						attributes: {
							class:
								'prose prose-sm dark:prose-invert focus:outline-none min-h-[200px] p-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-b-xl max-w-none max-h-[400px] overflow-auto',
						},
					},
					onUpdate: ({ editor }) => {
						editedBio = editor.getMarkdown()
					},
				})
			}
			initEditor()
		}

		if (!isEditingBio && editor) {
			editor.destroy()
			editor = undefined
		}
	})

	onDestroy(() => {
		editor?.destroy()
	})

	const styles = {
		sectionCard:
			'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-5 shadow-sm',
		header: 'flex items-center gap-6 my-3',
		label: 'text-sm font-bold text-accent-secondary dark:text-neutral-300 mb-2 block',
		toolbarBtn:
			'p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-600 dark:text-neutral-300 flex items-center gap-1',
		dropdownItem:
			'flex cursor-pointer items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:bg-neutral-100 dark:focus:bg-neutral-700 transition-colors',
		pfpWrapper:
			'relative group h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900',
	}
</script>

<svelte:head>
	<title>{userProfile.username} - AmpMod</title>
</svelte:head>

<div class="m-auto flex max-w-6xl flex-col gap-6 lg:p-8">
	<header class={styles.header}>
		<div class={styles.pfpWrapper}>
			<img src={userProfile.pfp} alt={userProfile.username} class="h-full w-full object-contain" />

			{#if canEdit}
				<button
					onclick={() => pfpInput?.click()}
					class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
					disabled={isUploadingPfp}
				>
					{#if isUploadingPfp}
						<Loader class="animate-spin" size={24} />
					{:else}
						<Pencil size={24} />
					{/if}
				</button>

				<form
					method="POST"
					action="?/updatePfp"
					enctype="multipart/form-data"
					use:enhance={() => {
						isUploadingPfp = true
						return async ({ result, update }) => {
							isUploadingPfp = false
							await update()
							// SvelteKit re-runs the load function, updating avatarUrl automatically
						}
					}}
					class="hidden"
				>
					<input type="hidden" name="targetUserId" value={userProfile.id} />
					<input
						bind:this={pfpInput}
						type="file"
						name="avatar"
						accept="image/*"
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
					/>
				</form>
			{/if}
		</div>

		<div class="flex grow flex-col justify-center">
			<div class="flex items-center gap-3">
				<h1 class="text-3xl font-bold text-neutral-800 dark:text-white">
					{userProfile.username}{#if userProfile.rank === 3}*{/if}
				</h1>
				{#if isViewerStaff && userStatus === 'banned'}
					<span
						class="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500"
						>BANNED</span
					>
				{/if}
			</div>
			<div class="flex items-center gap-2 text-sm opacity-50">
				<span>{rankMap[userProfile.rank ?? 0]}</span>
				<span>•</span>
				<span>Joined {joinedDate}</span>
			</div>
		</div>

		{#if isViewerStaff && !isOwnProfile}
			<div class="flex gap-2">
				<button
					onclick={() => (isBanModalOpen = true)}
					class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
				>
					<Gavel size={16} /> Ban User
				</button>
			</div>
		{/if}
	</header>

	<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
		<section class={styles.sectionCard}>
			<div class="mb-2 flex items-center justify-between border-b pb-2 dark:border-neutral-700">
				<span class={styles.label}>About Me</span>
				{#if canEdit && !isEditingBio}
					<button onclick={() => (isEditingBio = true)} class="text-neutral-400 hover:text-accent">
						<Pencil size={16} />
					</button>
				{/if}
			</div>

			{#if isEditingBio}
				<form
					method="POST"
					action="?/updateBio"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								userProfile.bio = editedBio
								isEditingBio = false
							}
							await update()
						}
					}}
					class="flex flex-col"
				>
					<input type="hidden" name="targetUserId" value={userProfile.id} />
					<input type="hidden" name="bio" value={editedBio} />

					<div
						class="flex items-center gap-1 rounded-t-xl border border-b-0 border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-600 dark:bg-neutral-800"
					>
						<button
							type="button"
							class={styles.toolbarBtn}
							onclick={() => editor?.chain().focus().toggleBold().run()}><Bold size={16} /></button
						>
						<button
							type="button"
							class={styles.toolbarBtn}
							onclick={() => editor?.chain().focus().toggleItalic().run()}
							><Italic size={16} /></button
						>
						<button
							type="button"
							class={styles.toolbarBtn}
							onclick={() => editor?.chain().focus().toggleBulletList().run()}
							><List size={16} /></button
						>

						<DropdownMenu.Root>
							<DropdownMenu.Trigger class={styles.toolbarBtn}>
								<HeadingIcon size={16} /><ChevronDown size={12} class="opacity-50" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Content
								class="z-50 min-w-[140px] rounded-lg border border-neutral-300 bg-white p-1 shadow-xl dark:border-neutral-600 dark:bg-neutral-800"
							>
								<DropdownMenu.Item
									class={styles.dropdownItem}
									onSelect={() => editor?.chain().focus().setParagraph().run()}
									>Normal text</DropdownMenu.Item
								>
								<DropdownMenu.Item
									class={styles.dropdownItem}
									onSelect={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
									><span class="font-bold">Heading 1</span></DropdownMenu.Item
								>
								<DropdownMenu.Item
									class={styles.dropdownItem}
									onSelect={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
									><span class="font-semibold">Heading 2</span></DropdownMenu.Item
								>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>

					<div bind:this={editorElement}>
						{#if !editor}
							<div
								class="flex h-[200px] items-center justify-center rounded-b-xl border border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900/50"
							>
								<span class="text-sm opacity-50">Loading editor...</span>
							</div>
						{/if}
					</div>

					<div class="mt-4 flex gap-2">
						<button
							type="submit"
							class="flex items-center gap-3 rounded-full bg-accent px-4 py-1 text-sm font-bold text-white hover:bg-accent-secondary"
							><Save />Save</button
						>
						<button
							type="button"
							onclick={() => {
								isEditingBio = false
								editedBio = userProfile.bio ?? ''
							}}
							class="text-sm text-neutral-500">Cancel</button
						>
					</div>
				</form>
			{:else}
				<div
					class="prose max-h-[400px] min-h-[200px] max-w-none overflow-auto text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 dark:prose-invert"
				>
					{#if userProfile.bio}
						{@html md.render(userProfile.bio)}
					{:else if isOwnProfile}
						<i class="opacity-50">Tell us about yourself!</i>
					{:else}
						<i class="opacity-50">This user does not have an About Me.</i>
					{/if}
				</div>
			{/if}
		</section>

		<section
			class={`${styles.sectionCard} flex aspect-4/3 w-full flex-col self-start lg:w-[480px]`}
		>
			<div class="mb-4">
				<span class={styles.label}>Featured Project</span>
			</div>
			<div
				class="flex grow items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700"
			>
				<div class="text-center text-neutral-400">
					<FolderOpen class="mx-auto mb-2 opacity-20" size={32} />
					<p class="text-xs">No project featured.</p>
				</div>
			</div>
		</section>
	</div>

	<section class={styles.sectionCard}>
		<div class="mb-4 flex items-center justify-between">
			<span class={styles.label}>Shared Projects (0)</span>
			<a
				href="/users/{userProfile.username}/projects"
				class="text-xs font-bold text-accent hover:underline">View all</a
			>
		</div>
		<div
			class="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700"
		>
			<p class="text-sm text-neutral-400">User hasn't shared any projects yet.</p>
		</div>
	</section>
</div>
