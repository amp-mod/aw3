<script lang="ts">
	import ProjectGrid from '$lib/components/ProjectGrid.svelte'
	import Button from '$lib/components/Button.svelte'
	import { getProjects } from './loadshared.remote'
	import { ArrowLeft } from '@lucide/svelte'

	let page = $state(1)
	let projects = $state([])
	let exhausted = $state(false)
	let { data } = $props()

	// Reactive query: changing 'page' automatically triggers a fetch
	let query = $derived(getProjects({ page, userID: data.userProfile.id }))

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

<div class="m-auto max-w-5xl py-8 flex flex-col gap-4">
	<div class="flex gap-4 justify-start">
		<Button href="/users/{data.userProfile.username}"><ArrowLeft /></Button>
		<h1 class="text-3xl font-bold">Projects by {data.userProfile.username}</h1>
	</div>
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
