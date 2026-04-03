<script lang="ts">
	import { getPublicUrl } from '$lib/storage-helpers'
	import { LayoutGrid } from '@lucide/svelte'

	let { projects = [], emptyMessage = 'No projects found.' } = $props()

	const styles = {
		grid: 'flex overflow-x-auto gap-4 mt-2 pb-4 flex-nowrap scrollbar-hide',

		card: 'group flex flex-col gap-2 rounded-xl p-1 transition-all w-46 shrink-0',

		thumbContainer:
			'aspect-[4/3] w-full overflow-hidden rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900',

		titleContainer: 'flex w-full flex-col gap-0.5 min-w-0',

		title: 'px-1 text-sm font-bold truncate block dark:text-neutral-200 group-hover:text-accent',

		authorLink: 'px-1 text-xs text-neutral-500 hover:text-accent transition-colors truncate',
	}
</script>

<div class={styles.grid}>
	{#each projects as project (project.id)}
		<div class={styles.card}>
			<a href="/projects/{project.id}" class={styles.thumbContainer}>
				<img
					src={getPublicUrl(`projects/${project.id}/thumbnail.webp`)}
					alt={project.title}
					class="h-full w-full object-cover transition-transform"
					loading="lazy"
				/>
			</a>

			<div class="flex w-full flex-col gap-0.5">
				<a href="/projects/{project.id}" class={styles.title}>
					{project.title}
				</a>

				{#if project.author}
					<a href="/users/{project.author.username}" class={styles.authorLink}>
						by {project.author.username}
					</a>
				{/if}
			</div>
		</div>
	{:else}
		<p class="text-xs italic text-neutral-500 py-4">{emptyMessage}</p>
	{/each}
</div>
