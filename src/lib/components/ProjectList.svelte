<script lang="ts">
	import Project from './Project.svelte'

	let { projects = [], emptyMessage = 'No projects found.' } = $props()

	const gridStyle = 'flex overflow-x-auto gap-4 mt-2 pb-4 flex-nowrap scrollbar-hide'
</script>

<div class={gridStyle}>
	{#each projects as project (project.id)}
		<Project {project} />
	{:else}
		<p class="text-xs italic text-neutral-500 py-4">{emptyMessage}</p>
	{/each}
</div>
