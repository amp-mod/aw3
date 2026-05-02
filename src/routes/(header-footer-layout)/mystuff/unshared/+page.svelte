<script lang="ts">
	import { fade } from 'svelte/transition'
	import { getMyProjects } from '../loadstuff.remote'
	import ProjectVerticalList from '$lib/components/ProjectVerticalList.svelte'
	import Button from '$lib/components/Button.svelte'

	let page = $state(1)
	let projects = $state([])
	let exhausted = $state(false)

	// Reactive query: changing 'page' automatically triggers a fetch
	let query = $derived(getMyProjects({ page, type: 'unshared' }))

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

{#if projects.length !== 0}
	<ProjectVerticalList {projects} />
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
