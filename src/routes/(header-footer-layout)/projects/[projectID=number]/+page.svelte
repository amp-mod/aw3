<script lang="ts">
	import { Pencil, Star, MessageSquareWarning } from '@lucide/svelte'
	import Button from '$lib/components/Button.svelte'
	import ProjectRunner from '$lib/components/ProjectRunner.svelte'
	import { enhance } from '$app/forms'
	import { beforeNavigate } from '$app/navigation'
	import { getPfpPath } from '$lib/storage-helpers'
	import { CATEGORIES } from '$lib/categories'
	import { reportState } from '$lib/report.svelte'

	let { data } = $props()

	const project = $derived(data.project)
	const author = $derived(data.author)

	const canEdit = $derived(data.user && (data.user.id === project.userId || data.user.rank >= 2))
	const isMod = $derived(data.user && data.user.rank >= 2)

	let loadedExtensions = $state([])

	// UI State
	let titleValue = $state(data.project.title)
	let notesValue = $state(data.project.notes || '')

	let titleFormElement: HTMLFormElement | undefined = $state()
	let notesFormElement: HTMLFormElement | undefined = $state()

	let titleTimer: ReturnType<typeof setTimeout>
	let notesTimer: ReturnType<typeof setTimeout>

	// Tag Warning logic
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

	function handleTitleInput() {
		clearTimeout(titleTimer)
		titleTimer = setTimeout(() => {
			if (titleValue !== project.title) titleFormElement?.requestSubmit()
		}, 1000)
	}

	function handleNotesInput() {
		clearTimeout(notesTimer)
		notesTimer = setTimeout(() => {
			if (notesValue !== (project.notes || '')) notesFormElement?.requestSubmit()
		}, 1500)
	}

	$effect(() => {
		if (document.activeElement?.name !== 'title') titleValue = project.title
		if (document.activeElement?.name !== 'notes') notesValue = project.notes || ''
	})

	const styles = {
		sectionCard:
			'border border-neutral-300 dark:border-neutral-700 rounded p-4 bg-white dark:bg-neutral-900',
		label:
			'text-sm font-bold text-accent-secondary dark:text-neutral-300 mb-2 block flex items-center gap-2',
		inputBase:
			'w-full bg-transparent border border-dashed border-neutral-500/50 focus:border-solid focus:border-accent focus:outline-none dark:text-white text-neutral-800',
	}

	beforeNavigate(({ to, cancel }) => {
		cancel()
		location.href = to?.url.href
	})
</script>

<svelte:head>
	<title>{project.title} on AmpMod</title>
</svelte:head>

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
		<div class="flex w-full gap-4">
			<a href="/users/{author.username}" title={author.username} class="shrink-0">
				<img
					src={getPfpPath(author)['64']}
					class="h-12 w-12 rounded border border-black/10 object-fill dark:border-white/20"
					alt={author.username}
				/>
			</a>

			<div class="flex w-full flex-col gap-2">
				{#if canEdit}
					<form
						method="POST"
						action="?/renameProject"
						use:enhance={() =>
							({ update }) =>
								update({ reset: false })}
						bind:this={titleFormElement}
						class="flex flex-1 items-center gap-2"
					>
						<input
							name="title"
							type="text"
							bind:value={titleValue}
							oninput={handleTitleInput}
							placeholder="Project Title"
							class="{styles.inputBase} w-full rounded p-2 text-2xl font-semibold"
						/>
					</form>
				{:else}
					<h1 class="text-3xl font-bold text-neutral-800 dark:text-white">{project.title}</h1>
				{/if}
				<div class="flex items-center gap-2 text-sm">
					by <a href="/users/{author.username}" class="font-bold text-accent hover:underline"
						>{author.username}</a
					>
				</div>
			</div>

			<div class="grow"></div>
			<div class="shrink-0 gap-1">
				<Button
					href="/projects/{project.id}/editor"
					variant="secondary"
					class="flex items-center gap-2"
				>
					<Pencil size={18} /> Edit in AmpMod
				</Button>
			</div>
		</div>
	</header>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_480px]">
		<main class="relative flex flex-col gap-6">
			<ProjectRunner
				{project}
				bind:extensions={loadedExtensions}
				user={data.user}
				flashingLights={project.flashingLights}
			/>
		</main>

		<aside class="flex flex-col gap-4">
			<section class={styles.sectionCard}>
				<span class={styles.label}>Notes and Credits</span>
				<div class="max-h-100 overflow-y-auto">
					{#if canEdit}
						<form
							method="POST"
							action="?/editNotes"
							use:enhance={() =>
								({ update }) =>
									update({ reset: false })}
							bind:this={notesFormElement}
						>
							<textarea
								name="notes"
								bind:value={notesValue}
								oninput={handleNotesInput}
								placeholder="Add notes or credits..."
								class="{styles.inputBase} h-80 resize-none rounded p-2 text-sm"
							></textarea>
						</form>
					{:else}
						<p class="text-sm whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
							{project.notes || 'None provided.'}
						</p>
					{/if}
				</div>
			</section>

			{#if isMod}
				<section class="{styles.sectionCard} border-dashed border-accent/50 bg-accent/5">
					<span class={styles.label}>
						<Star size={14} class="text-accent {data.isFeatured ? 'fill-accent' : ''}" />
						Moderator Tools
					</span>

					{#if data.isFeatured}
						<form method="POST" action="?/unfeatureProject" use:enhance>
							<Button
								type="submit"
								variant="secondary"
								class="w-full border-red-500/20 text-xs text-red-500 hover:bg-red-500/10"
							>
								Remove from Featured
							</Button>
						</form>
					{:else}
						<form method="POST" action="?/featureProject" use:enhance class="flex flex-col gap-2">
							<input
								name="why"
								type="text"
								placeholder="Why feature this?"
								class="{styles.inputBase} rounded p-2 text-xs"
							/>
							<Button type="submit" variant="primary" class="w-full text-xs">Feature on Home</Button
							>
						</form>
					{/if}
				</section>
			{/if}

			<div class="flex flex-col gap-2 px-1">
				<p class="text-sm text-neutral-500">
					Copyright &copy; {new Date(project.createdAt).toLocaleDateString('en-GB', {
						day: 'numeric',
						month: 'short',
						year: 'numeric',
					})}
					{author.username}.
					<a href="/terms" class="link hover:underline">
						This project is licensed under CC-BY-SA 4.0.
					</a>
				</p>

				<button
					onclick={() => reportState.open(project.id, 'project', project.title)}
					class="flex w-fit items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-red-500"
				>
					<MessageSquareWarning size={14} /> Report Project
				</button>
			</div>
		</aside>
	</div>

	{#if loadedExtensions.length > 0}
		<section class="mt-4 flex flex-wrap gap-2">
			{#each loadedExtensions as ext}
				<div class="inline-flex items-center gap-2 rounded bg-blue-500/10 p-3">
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
					<span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
						{ext.name}
					</span>
				</div>
			{/each}
		</section>
	{/if}
</div>
