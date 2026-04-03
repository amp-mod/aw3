<script lang="ts">
	import ProjectRunner from '$lib/components/ProjectRunner.svelte'
	import { onMount } from 'svelte'

	let { data } = $props()

	const project = $derived(data.project)
</script>

<svelte:head>
	<title>Embed - AmpMod</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="m-auto h-screen overflow-hidden">
	<ProjectRunner {project} isEmbed />
</div>
