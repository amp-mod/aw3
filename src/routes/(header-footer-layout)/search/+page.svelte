<script lang="ts">
	import { fade } from 'svelte/transition'
	import { page } from '$app/state'
	import { goto } from '$app/navigation'
	import { search } from './search.remote'
	import ProjectGrid from '$lib/components/ProjectGrid.svelte'
	import Button from '$lib/components/Button.svelte'
	import { untrack } from 'svelte'

	// Get search term from URL: ?q=searchterm
	let searchTerm = $derived(page.url.searchParams.get('q'))

	let pageNum = $state(1)
	let projects = $state([])
	let exhausted = $state(false)

	// Reactive query: triggers when pageNum or searchTerm changes
	let query = $derived(
		search({
			page: pageNum,
			search: searchTerm,
		}),
	)

	// Reset logic: when the URL search param changes, reset everything
	$effect(() => {
		searchTerm // Track the derived value
		untrack(() => {
			pageNum = 1
			projects = []
			exhausted = false
		})
	})

	$effect(() => {
		if (query.error || !query.current) return

		if (query.current.length === 0) {
			exhausted = true
			return
		}

		const newItems = query.current
		const existingIds = new Set(projects.map((p) => p.id))
		const uniqueItems = newItems.filter((p) => !existingIds.has(p.id))

		if (uniqueItems.length > 0) {
			projects = [...projects, ...uniqueItems]
		}

		// Assume limit is 12
		if (newItems.length < 12) {
			exhausted = true
		}
	})

	function loadMore() {
		pageNum += 1
	}

	// Helper to clear search via URL
	function clearSearch() {
		const url = new URL($page.url)
		url.searchParams.delete('q')
		goto(url.toString())
	}
</script>

<div class="m-auto max-w-5xl py-8" in:fade>
	<h1 class="mb-8 text-3xl font-bold">Search</h1>

	{#if projects.length !== 0}
		<ProjectGrid {projects} />
	{:else if !query.loading && !query.error && searchTerm}
		<div class="py-20 text-center text-neutral-500">
			<p>No projects found</p>
		</div>
	{/if}

	{#if query.error}
		<div class="rounded bg-red-100 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
			Oops! Something went wrong while searching.
		</div>
	{:else if !exhausted && (projects.length > 0 || query.loading)}
		<div class="py-10 text-center">
			<Button onclick={loadMore} disabled={query.loading}>
				{query.loading ? 'Searching...' : 'Load More'}
			</Button>
		</div>
	{/if}
</div>
