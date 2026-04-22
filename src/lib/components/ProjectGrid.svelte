<script lang="ts">
	import Project from './Project.svelte'

	let { projects = [], emptyMessage = 'No projects found.' } = $props()
</script>

<div class="flex flex-wrap gap-6">
	{#each projects as project (project.id)}
		<Project {project} />
	{:else}
		<p class="py-10 text-center text-neutral-500 italic w-full">{emptyMessage}</p>
	{/each}
</div>
