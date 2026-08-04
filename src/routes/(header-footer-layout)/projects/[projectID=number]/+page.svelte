<script lang="ts">
	import {
		MessageSquareWarning,
		Loader,
		CircleCheck,
		RefreshCcw,
		Paperclip,
		CopyPlus,
		Hammer,
	} from '@lucide/svelte'
	import Button from '$lib/components/Button.svelte'
	import ProjectRunner from '$lib/components/ProjectRunner.svelte'
	import { getPfpPath } from '$lib/storage-helpers'
	import { CATEGORIES } from '$lib/categories'
	import { reportState } from '$lib/report.svelte'
	import { getProjectJson } from '../loadproject.remote'
	import { untrack } from 'svelte'
	import Modal from '$lib/components/Modal.svelte'
	import { enhance } from '$app/forms'
	import { md } from '$lib/markdown'
	import { fade, slide } from 'svelte/transition'
	import { acceptablePrefixes } from '$lib/security-manager.svelte'
	import ComingSoon from '$lib/components/ComingSoon.svelte'

	let { data } = $props()

	const project = $derived(data.project)
	const author = $derived(data.author)

	const canEdit = $derived(data.user && (data.user.id === project.userId || data.user.rank >= 2))
	const isMod = $derived(data.user && data.user.rank >= 2)

	let loadedExtensions = $state([])

	// UI State
	let titleValue = $state(data.project.title)
	let notesValue = $state(data.project.notes || '')
	let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle')
	let isShowingCopyLink = $state(false)
	let isShowingBanProject = $state(false)

	let titleTimer: ReturnType<typeof setTimeout>
	let notesTimer: ReturnType<typeof setTimeout>

	$effect(() => {
		untrack(() => {
			if (document.activeElement?.name !== 'title') titleValue = project.title
			if (document.activeElement?.name !== 'notes') notesValue = project.notes || ''
		})
	})

	// Cleanup timers on destruction to prevent memory leaks
	$effect(() => {
		return () => {
			clearTimeout(titleTimer)
			clearTimeout(notesTimer)
		}
	})

	// Manual Save Function
	async function saveData(action: 'renameProject' | 'editNotes', value: string) {
		saveStatus = 'saving'

		const formData = new FormData()
		const fieldName = action === 'renameProject' ? 'title' : 'notes'
		formData.append(fieldName, value)

		try {
			const response = await fetch(`?/${action}`, {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' },
			})

			if (response.ok) {
				saveStatus = 'saved'
				setTimeout(() => {
					if (saveStatus === 'saved') saveStatus = 'idle'
				}, 2000)
			} else {
				saveStatus = 'error'
			}
		} catch (e) {
			saveStatus = 'error'
		}
	}

	function handleTitleInput() {
		clearTimeout(titleTimer)
		titleTimer = setTimeout(() => {
			if (titleValue !== project.title) saveData('renameProject', titleValue)
		}, 1000)
	}

	function handleNotesInput() {
		clearTimeout(notesTimer)
		notesTimer = setTimeout(() => {
			if (notesValue !== (project.notes || '')) saveData('editNotes', notesValue)
		}, 1500)
	}

	const tagWarning = $derived.by(() => {
		if (!notesValue || !canEdit) return null
		const presentTags = Object.entries(CATEGORIES).filter(([_, tag]) => {
			const regex = new RegExp(`(?<![a-zA-Z0-9])${tag}(?![a-zA-Z0-9])`, 'gi')
			return regex.test(notesValue)
		})
		const activeTitles = presentTags.map(([title]) => title)
		if (activeTitles.length <= 1) return null

		const has = (t: string) => activeTitles.includes(t)
		if (has('Contest')) return null
		if ((has('Online') || has('3D')) && has('Music'))
			return 'Online or 3D projects containing #music are hidden from Home Page categories.'

		if (has('Story')) {
			const allowed = ['Story', 'Art', 'Animation', 'Game']
			const invalid = activeTitles.filter((t) => !allowed.includes(t))
			if (invalid.length > 0)
				return `#story cannot be combined with #${invalid[0].toLowerCase()} on the Home Page.`
		}
		if (has('Game')) {
			const allowed = ['Game', '3D', 'Platformer', 'Story']
			const invalid = activeTitles.filter((t) => !allowed.includes(t))
			if (invalid.length > 0)
				return `#game cannot be combined with #${invalid[0].toLowerCase()} on the Home Page.`
		}
		return null
	})

	const styles = {
		sectionCard:
			'border border-neutral-300 dark:border-neutral-700 rounded p-4 bg-white dark:bg-neutral-900',
		label:
			'text-sm font-bold text-accent-secondary dark:text-neutral-300 mb-2 block flex items-center gap-2',
		inputBase:
			'w-full bg-transparent border border-dashed border-neutral-500/50 focus:border-solid focus:border-accent focus:outline-none dark:text-white text-neutral-800 transition-all focus:ring-4 focus:ring-accent/20',
	}

	// we have the awaits experimental feature on so this will work
	const projectJson = await getProjectJson(project.id)
</script>

<svelte:head>
	<title>{project.title} on AmpMod</title>
</svelte:head>

{#if project.status !== 'shared'}
	<div
		class="bg-yellow-500/20 p-4 leading-tight font-bold text-accent dark:text-white"
		transition:slide
	>
		<div class="m-auto max-w-6xl">
			{#if project.status === 'unshared'}
				<div class="flex items-center justify-between">
					<span>This project is unshared. Do you want to share it?</span>
					<form method="POST" action="?/shareProject" class="inline" use:enhance>
						<Button type="submit" class="ml-1">Share now</Button>
					</form>
				</div>
			{:else if project.status === 'banned'}
				<p>
					AmpMod moderators have banned this project. It is now permanently unshared. If you believe
					this was a mistake, please contact support.
				</p>
				{#if project.moderatorNote}
					<p class="mt-1 font-normal opacity-90">
						{project.moderatorNote}
					</p>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<div class="m-auto flex max-w-6xl flex-col gap-2 lg:p-8">
	{#if tagWarning}
		<div
			class="mt-2 rounded border border-amber-500/20 bg-amber-500/5 p-2 leading-tight font-medium text-amber-600 dark:text-amber-400"
		>
			<span class="font-bold tracking-tight uppercase">Warning!</span>
			{tagWarning} Your project will not appear on the front page's randomised topic row.
		</div>
	{/if}

	<header class="flex flex-col items-center gap-1 border-neutral-200 pb-6 dark:border-neutral-800">
		<div class="flex w-full gap-2">
			<a href="/users/{author.username}" title={author.username} class="shrink-0">
				<img
					src={getPfpPath(author)['64']}
					class="h-12 w-12 rounded border border-black/10 object-fill dark:border-white/20"
					alt={author.username}
				/>
			</a>

			<div class="flex w-full flex-col gap-2">
				{#if canEdit}
					<div class="flex flex-1 items-center gap-2">
						<input
							name="title"
							type="text"
							bind:value={titleValue}
							oninput={handleTitleInput}
							placeholder="Project Title"
							class="{styles.inputBase} h-12 w-full rounded p-2 text-2xl"
						/>
					</div>
				{:else}
					<h1 class="text-3xl font-bold text-neutral-800 dark:text-white">{project.title}</h1>
				{/if}
				<div class="flex items-center gap-3 text-sm">
					<span class="text-neutral-500">
						by <a href="/users/{author.username}" class="font-bold text-accent hover:underline"
							>{author.username}</a
						>
					</span>

					<div
						class="flex items-center gap-1.5 transition-opacity duration-300"
						class:opacity-0={saveStatus === 'idle'}
					>
						{#if saveStatus === 'saving'}
							<Loader size={12} class="animate-spin text-neutral-400" />
							<span class="text-xs text-neutral-400 italic">Saving changes...</span>
						{:else}
							<CircleCheck size={12} class="text-green-500" />
							<span class="text-xs font-medium text-green-500">Changes saved</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="grow"></div>
			<div class="flex shrink-0 items-start gap-3">
				{#if data.user && data.user.id !== project.userId}
					<form method="POST" action="?/remixProject" class="flex" use:enhance>
						<input type="hidden" name="projectId" value={project.id} />
						<Button type="submit" class="flex h-12 items-center gap-2">
							<CopyPlus /> Remix
						</Button>
					</form>
				{/if}
				<Button href="/projects/{project.id}/editor" class="flex h-12 items-center gap-2">
					<RefreshCcw size={18} /> See inside
				</Button>
			</div>
		</div>
	</header>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_480px]">
		<main class="relative flex flex-col gap-6">
			{#key project.id}
				<ProjectRunner
					{project}
					{projectJson}
					bind:extensions={loadedExtensions}
					user={data.user}
				/>
			{/key}
		</main>

		<aside class="flex flex-col gap-4">
			{#if data.isRemix}
				<div class="{styles.sectionCard} text-sm">
					<p>
						Thanks to <a href="/users/{data.originalProject?.author?.username}" class="link">
							{data.originalProject?.author?.username}
						</a>
						for
						<a href="/projects/{data.originalProject?.id}" class="link">
							{data.originalProject?.title}
						</a>
					</p>
				</div>
			{/if}
			<div class="grow">
				{#if canEdit}
					<div class="flex h-full flex-col gap-1">
						<label for="project-notes-textarea" class={styles.label}>Notes and Credits</label>
						<textarea
							id="project-notes-textarea"
							name="notes"
							bind:value={notesValue}
							oninput={handleNotesInput}
							placeholder="How do you use this project? Did you use assets from other people? If so, credit them here."
							class="{styles.inputBase} h-full w-full resize-none rounded-lg p-4 text-sm"
						></textarea>
					</div>
				{:else}
					<div class="text-sm {styles.sectionCard} h-full">
						<h2 class="mb-2 text-lg font-bold text-neutral-800 dark:text-white">
							Notes and Credits
						</h2>
						<div
							class="prose flex-1 overflow-auto text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 dark:prose-invert prose-a:font-bold prose-a:text-accent prose-a:no-underline prose-a:hover:underline dark:prose-a:text-accent-light"
						>
							{#if project.notes}
								{@html md.render(project.notes)}
							{:else}
								<span class="opacity-50">No project notes.</span>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</aside>
	</div>
	<div class="flex flex-wrap items-center justify-end gap-2 px-1">
		<p class="text-sm text-neutral-500">
			Shared {new Date(project.createdAt).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
			})}
		</p>
		{#if isMod}
			{#if data.isFeatured}
				<form method="POST" action="?/unfeatureProject">
					<Button type="submit">Unfeature</Button>
				</form>
			{:else}
				<form method="POST" action="?/featureProject" class="flex">
					<input name="why" type="text" placeholder="Why feature this?" hidden />
					<Button type="submit">Feature</Button>
				</form>
			{/if}

			<Button onclick={() => (isShowingBanProject = true)} class="flex items-center gap-2">
				<Hammer />
				{#if project.status === 'banned'}
					Unban{:else}Ban{/if}
			</Button>
		{/if}
		<Button onclick={() => (isShowingCopyLink = true)} class="flex items-center gap-2">
			<Paperclip /> Copy Link
		</Button>
		{#if data.user && data.user.id !== project.userId}
			<Button
				onclick={() => reportState.open(project.id, 'project', project.title)}
				class="flex items-center gap-2"
			>
				<MessageSquareWarning /> Report
			</Button>
		{/if}
	</div>
	{#if loadedExtensions.length > 0}
		<section class="flex items-center gap-2 overflow-x-auto">
			{#each loadedExtensions as ext}
				<div
					class="inline-flex shrink-0 items-center gap-3 rounded-lg border border-black/10 px-3 py-1.5 dark:border-white/10"
					style:background-color={ext.color1 + '14'}
				>
					{#if ext.icon}
						<img src={ext.icon} alt="" class="h-5 w-5" />
					{:else}
						<div
							class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[8px] font-bold"
							class:bg-accent={!ext.color1}
							class:text-white={!ext.color1}
							style:background-color={ext.color1}
							style:border-color={ext.color2}
						></div>
					{/if}
					<span class="text-neutral-700 dark:text-neutral-300">
						{ext.name}
					</span>
				</div>
			{/each}
		</section>
	{/if}
	<h2 class="text-2xl font-bold">Comments</h2>

	<ComingSoon />
</div>

<Modal bind:open={isShowingCopyLink} title="Copy project link">
	<div class="flex flex-col gap-4">
		{#if project.status !== 'shared'}
			<div
				class="flex items-center justify-between rounded border border-amber-500/20 bg-amber-500/5 p-2 leading-tight font-medium text-amber-600 dark:text-amber-400"
			>
				<span>Share this project for links to work.</span>
				<form method="POST" action="?/shareProject" class="inline" use:enhance>
					<Button type="submit" class="ml-1">Share</Button>
				</form>
			</div>
		{/if}
		<h2 class="text-lg font-semibold">Link</h2>
		<p>Share this project with friends:</p>
		<input
			type="text"
			value={window.location.href}
			class="input"
			readonly
			onfocus={(e) => e.currentTarget.select()}
		/>
		<Button
			onclick={() => {
				navigator.clipboard.writeText(window.location.href)
				isShowingCopyLink = false
			}}
			class="self-end"
		>
			Copy
		</Button>

		<h2 class="text-lg font-semibold">HTML embed</h2>
		<p>Share this project on your website:</p>
		<textarea
			readonly
			class="input"
			value={`<iframe src="${window.location.href}/embed" title="AmpMod project" style="border: none;"></iframe>`}
			onfocus={(e) => e.currentTarget.select()}
		></textarea>
		<Button
			onclick={() => {
				navigator.clipboard.writeText(
					`<iframe src="${window.location.href}/embed" title="AmpMod project" style="border: none;"></iframe>`,
				)
				isShowingCopyLink = false
			}}
			class="self-end"
		>
			Copy
		</Button>
	</div>
</Modal>

<Modal bind:open={isShowingBanProject} title="Ban project">
	<div class="flex flex-col gap-4">
		{#if project.status === 'banned'}
			<h2 class="text-lg font-semibold">Unban Project</h2>
			<p>This project is currently banned. Do you want to unban it?</p>
			<form method="POST" action="?/unbanProject" class="flex flex-col gap-4">
				<div class="flex justify-end gap-2">
					<Button type="button" onclick={() => (isShowingBanProject = false)}>Cancel</Button>
					<Button type="submit" class="bg-green-600 text-white hover:bg-green-700"
						>Unban Project</Button
					>
				</div>
			</form>
		{:else}
			<h2 class="text-lg font-semibold">Ban this project?</h2>
			<p>Are you sure you want to ban this project? This action can be undone.</p>
			<form method="POST" action="?/banProject" class="flex flex-col gap-4">
				<input
					name="moderatorNote"
					type="text"
					placeholder="Reason for banning (optional)"
					class="w-full rounded border border-neutral-500 p-2"
				/>
				<div class="flex justify-end gap-2">
					<Button type="button" onclick={() => (isShowingBanProject = false)}>Cancel</Button>
					<Button type="submit" class="bg-red-600 text-white hover:bg-red-700">Ban Project</Button>
				</div>
			</form>
		{/if}
	</div>
</Modal>
