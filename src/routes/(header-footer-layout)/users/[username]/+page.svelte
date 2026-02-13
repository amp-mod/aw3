<script lang="ts">
	import { onDestroy } from 'svelte'
	import {
		UserRound,
		Pencil,
		FolderOpen,
		Bold,
		Italic,
		List,
		Gavel,
		Heading as HeadingIcon,
		ChevronDown,
		Save,
		Loader,
	} from '@lucide/svelte'
	import { DropdownMenu } from 'bits-ui'
	import { enhance } from '$app/forms'
	import { rankMap, isStaff } from '$lib/ranks'
	import MarkdownIt from 'markdown-it'
	import { type Editor } from '@tiptap/core'
	import Modal from '$lib/components/Modal.svelte'
	import { m } from '$lib/paraglide/messages'

	let { data } = $props()

	// 1. Initialize local state from data
	let userProfile = $state(data.userProfile)
	let userStatus = $state(data.userProfile.status)
	let isEditingBio = $state(false)
	let editedBio = $state(data.userProfile.bio ?? '')
	let isUploadingPfp = $state(false)
	let isBanModalOpen = $state(false)

	// 2. Navigation Sync: Reset state when the user ID changes
	$effect(() => {
		// Accessing data.userProfile.id creates a dependency on the current route's user
		const newUser = data.userProfile
		userProfile = newUser
		userStatus = newUser.status
		editedBio = newUser.bio ?? ''

		// Close UI states when moving to a new person
		isEditingBio = false
		isBanModalOpen = false
	})

	const { isOwnProfile, isViewerStaff } = $derived(data)

	const md = new MarkdownIt({
		html: false,
		linkify: true,
		typographer: true,
		breaks: true,
	})

	const joinedDate = $derived(
		userProfile.createdAt
			? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				})
			: 'Unknown',
	)

	const viewerIsOp = $derived(isStaff(data.user?.rank))
	const canEdit = $derived(isOwnProfile || viewerIsOp)

	let editorElement: HTMLElement | undefined = $state()
	let editor: Editor | undefined = $state()
	let pfpInput: HTMLInputElement | undefined = $state()

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

		// Cleanup editor if user stops editing or moves pages
		return () => {
			if (editor) {
				editor.destroy()
				editor = undefined
			}
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
		modalLabel: 'mb-1 block text-xs font-bold uppercase text-neutral-500',
		modalInput:
			'w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-900',
	}
</script>

<svelte:head>
	<title>{userProfile.username} - AmpMod</title>
</svelte:head>

<Modal bind:open={isBanModalOpen} title={m.adminBan()}>
	<div class="flex flex-col gap-2">
		<p class="mb-4 text-sm text-neutral-600 dark:text-neutral-300">
			{m.adminBanDesc({ username: data.userProfile.username })}
		</p>

		<form
			method="POST"
			action="?/banUser"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						userStatus = 'banned'
						isBanModalOpen = false
					}
					await update()
				}
			}}
			class="flex flex-col gap-4"
		>
			<input type="hidden" name="targetUserId" value={userProfile.id} />
			<div>
				<label for="duration" class={styles.modalLabel}>{m.duration()}</label>
				<select name="duration" id="duration" class={styles.modalInput}>
					<option value="permanent">{m.permanent()}</option>
					<option value="24h">{m.dayInHours()}</option>
					<option value="7d">{m.weekInDays()}</option>
					<option value="30d">{m.monthInDays()}</option>
				</select>
			</div>
			<div>
				<label for="reason" class={styles.modalLabel}>{m.reason()}</label>
				<textarea
					id="reason"
					name="reason"
					placeholder="Violation of community guidelines..."
					class="{styles.modalInput} min-h-[100px] resize-none"
					required
				></textarea>
			</div>
			<div class="mt-2 flex justify-end gap-3">
				<button
					type="button"
					onclick={() => (isBanModalOpen = false)}
					class="px-4 py-2 text-sm font-semibold text-neutral-500 hover:text-neutral-700"
					>{m.cancel()}</button
				>
				<button
					type="submit"
					class="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
					>{m.adminBanConfirm()}</button
				>
			</div>
		</form>
	</div>
</Modal>

<div class="m-auto flex max-w-6xl flex-col gap-6 lg:p-8">
	<header class={styles.header}>
		<div class={styles.pfpWrapper}>
			{#if userProfile.pfp}
				<img src={userProfile.pfp} alt={userProfile.username} class="h-full w-full object-cover" />
			{:else}
				<div class="flex h-full w-full items-center justify-center text-neutral-400">
					<UserRound size={56} />
				</div>
			{/if}

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
						return async ({ update }) => {
							isUploadingPfp = false
							await update()
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
				{#if userStatus === 'banned'}
					<span
						class="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500"
						>{m.userBanned()}</span
					>
				{/if}
			</div>
			<div class="flex items-center gap-2 text-sm opacity-50">
				<span>{rankMap[userProfile.rank ?? 0]}</span>
				<span>•</span>
				<span>{m.joinedDate({ joinedDate })}</span>
			</div>
		</div>

		{#if isViewerStaff && !isOwnProfile}
			<div class="flex gap-2">
				<button
					onclick={() => (isBanModalOpen = true)}
					class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
				>
					<Gavel size={16} />
					{m.adminBan()}
				</button>
			</div>
		{/if}
	</header>

	<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
		<section class={styles.sectionCard}>
			<div class="mb-2 flex items-center justify-between border-b pb-2 dark:border-neutral-700">
				<span class={styles.label}>{m.aboutMe()}</span>
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
							<DropdownMenu.Trigger class={styles.toolbarBtn}
								><HeadingIcon size={16} /><ChevronDown
									size={12}
									class="opacity-50"
								/></DropdownMenu.Trigger
							>
							<DropdownMenu.Content
								class="z-50 min-w-[140px] rounded-lg border border-neutral-300 bg-white p-1 shadow-xl dark:border-neutral-600 dark:bg-neutral-800"
							>
								<DropdownMenu.Item
									class={styles.dropdownItem}
									onSelect={() => editor?.chain().focus().setParagraph().run()}
									>{m.wysiwygNormal()}</DropdownMenu.Item
								>
								<DropdownMenu.Separator class="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />
								<DropdownMenu.Item
									class={styles.dropdownItem}
									onSelect={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
									><span class="font-bold">{m.wysiwygHeading1()}</span></DropdownMenu.Item
								>
								<DropdownMenu.Item
									class={styles.dropdownItem}
									onSelect={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
									><span class="font-semibold">{m.wysiwygHeading2()}</span></DropdownMenu.Item
								>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>

					<div bind:this={editorElement}>
						{#if !editor}
							<div
								class="flex h-[200px] items-center justify-center rounded-b-xl border border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900/50"
							>
								<span class="text-sm opacity-50"><Loader /></span>
							</div>
						{/if}
					</div>

					<div class="mt-4 flex gap-2">
						<button
							type="submit"
							class="flex items-center gap-3 rounded-full bg-accent px-4 py-1 text-sm font-bold text-white transition-colors hover:bg-accent-secondary"
							><Save size={18} /> {m.save()}</button
						>
						<button
							type="button"
							onclick={() => (isEditingBio = false)}
							class="text-sm text-neutral-500">{m.cancel()}</button
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
						<i class="opacity-50">{m.aboutMePlaceholderEdit()}</i>
					{:else}
						<i class="opacity-50">{m.aboutMePlaceholder()}</i>
					{/if}
				</div>
			{/if}
		</section>

		<section
			class={`${styles.sectionCard} flex aspect-4/3 w-full flex-col self-start lg:w-[480px]`}
		>
			<div class="mb-4"><span class={styles.label}>{m.featuredProject()}</span></div>
			<div
				class="flex grow items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700"
			>
				<div class="text-center text-neutral-400">
					<FolderOpen class="mx-auto mb-2 opacity-20" size={32} />
					<p class="text-xs">{m.noFeaturedProject()}</p>
				</div>
			</div>
		</section>
	</div>
</div>
