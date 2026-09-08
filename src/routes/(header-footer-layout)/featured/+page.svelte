<script lang="ts">
	import { fade } from 'svelte/transition'
	import { getFeaturedProjects } from './loadfeatured.remote'
	import ProjectGrid from '$lib/components/ProjectGrid.svelte'
	import Button from '$lib/components/Button.svelte'

	let page = $state(1)
	let projects = $state([])
	let exhausted = $state(false)

	// Reactive query: changing 'page' automatically triggers a fetch
	let query = $derived(getFeaturedProjects(page))

	$effect(() => {
		// Guard: Stop if error or no data
		if (query.error || !query.current) return

		// If the server returns empty, we've hit the end
		if (query.current.length === 0) {
			exhausted = true
			return
		}

		// Merge new items, ensuring no duplicates by ID
		const newItems = query.current
		const existingIds = new Set(projects.map((p) => p.id))
		const uniqueItems = newItems.filter((p) => !existingIds.has(p.id))

		if (uniqueItems.length > 0) {
			projects = [...projects, ...uniqueItems]
		}
	})

	function loadMore() {
		page += 1
	}
</script>

<div class="m-auto max-w-5xl py-8">
	<h1 class="mb-8 text-3xl font-bold">Featured Projects</h1>

	{#if projects.length !== 0}
		<ProjectGrid {projects} />
	{/if}

	{#if query.error}
		<div class="rounded bg-red-100 p-4 text-red-700">
			Oops! Something went wrong loading projects.
		</div>
	{:else if !exhausted}
		<div class="py-10 text-center">
			<Button onclick={loadMore}>
				{query.loading ? 'Loading...' : 'Load More'}
			</Button>
		</div>
	{/if}
</div>
