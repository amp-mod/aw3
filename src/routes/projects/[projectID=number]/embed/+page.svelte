<script lang="ts">
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import ProjectRunner from '$lib/components/ProjectRunner.svelte'
	import { getProject } from '$lib/loadproject.remote'
	import type { Project } from '$lib/server/db/schema'

	let { params } = $props()

	let project = $state<Project | { error: string } | undefined>(undefined)

	$effect(() => {
		if (!browser) return

		async function load() {
			try {
				project = await getProject(+params.projectID)
			} catch (e) {
				console.error(e)
				project = { error: 'Unknown error' }
			}
		}

		load()
	})
</script>

<svelte:head>
	<title>Embed - AmpMod</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="m-auto h-screen overflow-hidden">
	{#if project && 'error' in project}
		<div class="bg-accent w-full h-screen flex flex-col items-center justify-center gap-4">
			<h2 class="text-2xl font-bold">Error</h2>
			<p>{project.error}</p>
		</div>
	{:else if project}
		<ProjectRunner {project} isEmbed />
	{:else}
		<div class="bg-accent w-full h-screen"></div>
	{/if}
</div>
