<script lang="ts">
	import { getMyProjects } from './loadstuff.remote'
	import ProjectVerticalList from '$lib/components/ProjectVerticalList.svelte'
	import Button from '$lib/components/Button.svelte'
	import { myStuffState } from './mystuff.svelte'
	import { untrack } from 'svelte'

	let { type } = $props<{ type: 'shared' | 'unshared' }>()

	let page = $state(1)
	let projects = $state([])

	// 1. Client-side filtering driven by the global state
	let filteredProjects = $derived(
		myStuffState.searchTerm.trim() === ''
			? projects
			: projects.filter((p) =>
					p.title.toLowerCase().includes(myStuffState.searchTerm.toLowerCase()),
				),
	)

	// 2. Reset list and pagination when tab category or search changes
	$effect(() => {
		type
		myStuffState.searchTerm

		untrack(() => {
			page = 1
			projects = []
		})
	})

	// 3. Remote Query - reacts to page, type, and the global search term
	const query = $derived(
		getMyProjects({
			page,
			type,
			search: myStuffState.searchTerm,
		}),
	)

	// 4. Data Synchronization
	$effect(() => {
		const newItems = query.current

		if (newItems && newItems.length > 0) {
			untrack(() => {
				if (page === 1) {
					// Refresh list for new search/tab
					projects = newItems
				} else {
					// Append for "Load More"
					const existingIds = new Set(projects.map((p) => p.id))
					const uniqueItems = newItems.filter((p) => !existingIds.has(p.id))
					projects = [...projects, ...uniqueItems]
				}
			})
		} else if (newItems?.length === 0 && page === 1) {
			untrack(() => {
				projects = []
			})
		}
	})

	function loadMore() {
		page += 1
	}
</script>

{#if filteredProjects.length !== 0}
	<ProjectVerticalList projects={filteredProjects} />
{:else if !query.loading && !query.error}
	<div class="space-y-6 py-24 text-center">
		{#if myStuffState.searchTerm}
			<div class="text-neutral-500">
				<p class="text-lg">No matches found for "{myStuffState.searchTerm}"</p>
				<button
					onclick={() => (myStuffState.searchTerm = '')}
					class="mt-2 text-sm text-accent underline underline-offset-4"
				>
					Clear search
				</button>
			</div>
		{:else if type === 'shared'}
			<div class="mx-auto max-w-md space-y-4">
				<h2 class="text-3xl font-bold text-black dark:text-white">Share projects!</h2>
				<p class="text-neutral-600 dark:text-neutral-400">
					You haven't shared any projects yet. You can find your unshared projects in the unshared
					tab.
				</p>
				<Button href="/projects/editor" class="mt-4">Create a project</Button>
			</div>
		{:else}
			<div class="mx-auto max-w-md space-y-4">
				<p class="text-5xl">Nothing here :(</p>
			</div>
		{/if}
	</div>
{/if}

{#if query.error}
	<div
		class="my-8 rounded-lg bg-red-100 p-6 text-center text-red-700 dark:bg-red-900/20 dark:text-red-400"
	>
		<p class="font-semibold">Unable to load projects</p>
		<p class="text-sm opacity-80">Please check your connection and try again.</p>
	</div>
{:else}
	<div class="py-10 text-center">
		{#if query.loading}
			<div class="flex items-center justify-center gap-3 text-neutral-400">
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
				></div>
			</div>
		{:else if query.current?.length !== 0 && projects.length > 0}
			<Button onclick={loadMore} variant="outline">Load More</Button>
		{/if}
	</div>
{/if}
