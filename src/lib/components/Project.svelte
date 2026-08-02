<script lang="ts">
	import { getPublicUrl } from '$lib/storage-helpers'

	// Destructure vertical with a default value of false
	let { project, vertical = false } = $props()

	const styles = {
		// Use template literals to toggle between horizontal (default) and vertical layouts
		card: `group relative flex gap-3 rounded-xl p-2 transition-all border border-black/10 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 
               ${vertical ? 'flex-row items-center w-full' : 'flex-col w-52 shrink-0'}`,

		thumbContainer: `overflow-hidden rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 
                         ${vertical ? 'aspect-[4/3] h-18 shrink-0' : 'aspect-[4/3] w-full'}`,

		mainLink: 'after:absolute after:inset-0 focus:outline-none',
		title: 'px-1 text-sm font-bold truncate block dark:text-neutral-200 group-hover:text-accent',
		authorLink:
			'relative z-10 px-1 text-xs text-neutral-500 hover:text-accent transition-colors truncate',
	}
</script>

<div class="{styles.card} {project.status === 'banned' ? 'opacity-50' : ''}">
	<div class={styles.thumbContainer}>
		<img
			src={getPublicUrl(`projects/${project.id}/thumbnail.webp`)}
			alt={project.title}
			class="h-full w-full object-cover transition-transform"
			loading="lazy"
		/>
	</div>

	<div class="flex min-w-0 flex-col gap-0.5">
		<a href="/projects/{project.id}" class="{styles.title} {styles.mainLink}">
			{project.title}
		</a>

		{#if project.author}
			<a href="/users/{project.author.username}" class={styles.authorLink}>
				by {project.author.username}
			</a>
		{/if}

		{#if project.createdAt && vertical}
			<p class="px-1 text-xs text-neutral-500 dark:text-neutral-400">
				Created on {new Date(project.createdAt).toLocaleDateString()}
			</p>
		{/if}

		{#if project.status === 'banned'}
			<p class="mt-1 px-1 text-xs font-bold text-red-500">Banned</p>
		{/if}
	</div>
</div>
