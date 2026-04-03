<script lang="ts">
	import { page } from '$app/state'
	import { Pencil, Info, Puzzle } from '@lucide/svelte'
	import Button from '$lib/components/Button.svelte'
	import ProjectRunner from '$lib/components/ProjectRunner.svelte'
	import { enhance } from '$app/forms'
	import { beforeNavigate } from '$app/navigation'
	import { acceptablePrefixes } from '$lib/security-manager.svelte.js'

	let { data } = $props()

	const project = $derived(data.project)
	const author = $derived(data.author)

	// Permission check
	const canEdit = $derived(data.user && (data.user.id === project.userId || data.user.rank >= 2))

	let loadedExtensions = $state([])
	let titleValue = $state(project.title)
	let notesValue = $state(project.notes || '')

	let titleFormElement: HTMLFormElement | undefined = $state()
	let notesFormElement: HTMLFormElement | undefined = $state()

	// Sync values if the project data changes from the server
	$effect(() => {
		titleValue = project.title
		notesValue = project.notes || ''
	})

	// Auto-save Title (600ms debounce)
	$effect(() => {
		if (titleValue === project.title) return
		const timer = setTimeout(() => {
			titleFormElement?.requestSubmit()
		}, 600)
		return () => clearTimeout(timer)
	})

	// Auto-save Notes (600ms debounce)
	$effect(() => {
		if (notesValue === (project.notes || '')) return
		const timer = setTimeout(() => {
			notesFormElement?.requestSubmit()
		}, 600)
		return () => clearTimeout(timer)
	})

	const styles = {
		sectionCard:
			'border border-neutral-300 dark:border-neutral-700 rounded p-4 bg-white dark:bg-neutral-900',
		label:
			'text-sm font-bold text-accent-secondary dark:text-neutral-300 mb-2 block flex items-center gap-2',
		inputBase:
			'w-full bg-transparent border border-dashed border-neutral-500/50 focus:border-solid focus:border-accent focus:outline-none dark:text-white text-neutral-800',
	}
</script>

<svelte:head>
	<title>{project.title} on AmpMod</title>
</svelte:head>

<div class="m-auto flex max-w-6xl flex-col gap-6 lg:p-8">
	<header class="flex flex-col gap-1 border-neutral-200 pb-6 dark:border-neutral-800">
		<div class="flex items-center justify-between gap-4">
			{#if canEdit}
				<form
					method="POST"
					action="?/renameProject"
					use:enhance={() => {
						return async ({ update }) => {
							await update({ reset: false })
						}
					}}
					bind:this={titleFormElement}
					class="flex flex-1 items-center gap-2"
				>
					<input
						name="title"
						type="text"
						bind:value={titleValue}
						placeholder="Project Title"
						class="{styles.inputBase} rounded p-2 text-2xl font-semibold"
					/>
				</form>
			{:else}
				<h1 class="text-3xl font-bold text-neutral-800 dark:text-white">
					{project.title}
				</h1>
			{/if}

			<div class="flex shrink-0 gap-1">
				<Button
					href="/projects/{project.id}/editor"
					variant="secondary"
					class="flex items-center gap-2"
				>
					<Pencil size={18} />
					Edit in AmpMod
				</Button>
			</div>
		</div>

		<div class="flex items-center gap-2 text-sm">
			<a href="/users/{author.username}" class="font-bold text-accent hover:underline">
				{author.username}
			</a>
		</div>
	</header>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
		<main class="relative flex flex-col gap-6">
			<ProjectRunner {project} bind:extensions={loadedExtensions} />
		</main>

		<aside class="flex flex-col gap-4">
			<section class={styles.sectionCard}>
				<span class={styles.label}>Notes and Credits</span>

				<div class="max-h-[200px] overflow-y-auto">
					{#if canEdit}
						<form
							method="POST"
							action="?/editNotes"
							use:enhance={() => {
								return async ({ update }) => {
									await update({ reset: false })
								}
							}}
							bind:this={notesFormElement}
						>
							<textarea
								name="notes"
								bind:value={notesValue}
								placeholder="Add notes or credits..."
								class="{styles.inputBase} min-h-[100px] resize-none rounded p-2 text-sm"
							></textarea>
						</form>
					{:else}
						<p class="text-sm whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
							{project.notes || 'None provided.'}
						</p>
					{/if}
				</div>
			</section>

			<div class="flex flex-col gap-2 px-1">
				<p class="text-xs text-neutral-500">
					Copyright &copy; {new Date(project.createdAt).toLocaleDateString('en-GB', {
						day: 'numeric',
						month: 'short',
						year: 'numeric',
					})}
					{author.username}.
				</p>
				<a href="/terms" class="text-xs text-accent hover:underline">
					This project is licensed under CC-BY-SA 4.0.
				</a>
			</div>
		</aside>
	</div>

	{#if loadedExtensions.length > 0}
		<section class="mt-4 flex flex-col gap-3">
			<div class="flex flex-wrap gap-2">
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
			</div>
		</section>
	{/if}
</div>
