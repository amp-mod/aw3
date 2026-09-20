<script lang="ts">
	import { getPublicUrl } from '$lib/storage-helpers'
	import Button from '$lib/components/Button.svelte'
	import { DropdownMenu } from 'bits-ui'
	import { Ellipsis } from '@lucide/svelte'

	interface Action {
		label: string
		onClick: () => void
	}

	let {
		project,
		vertical = false,
		actions = [],
	}: { project: any; vertical?: boolean; actions?: Action[] } = $props()

	const styles = {
		card: `group relative flex gap-3 rounded-xl p-2 transition-all border border-black/10 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 
               ${vertical ? 'flex-row items-center w-full' : 'flex-col w-55 shrink-0'} bg-white dark:bg-neutral-900`,

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

	<div class="flex flex-1 justify-between gap-2">
		<div class="flex min-w-0 flex-col gap-0.5">
			<a
				href="/projects/{project.id}"
				class="{styles.title} {styles.mainLink}"
				title={project.title}
			>
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

		{#if actions.length > 0}
			{#if vertical}
				<div class="relative z-10 flex flex-col items-end gap-1">
					{#each actions as action}
						<Button onclick={action.onClick}>{action.label}</Button>
					{/each}
				</div>
			{:else}
				<div class="relative z-10">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex h-7 w-7 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors focus:outline-none cursor-pointer"
							aria-label="Project options"
						>
							<Ellipsis />
						</DropdownMenu.Trigger>

						<DropdownMenu.Portal>
							<DropdownMenu.Content
								class="z-50 min-w-32 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900"
								align="end"
								sideOffset={4}
							>
								{#each actions as action}
									<DropdownMenu.Item
										class="cursor-pointer rounded-md px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white outline-none transition-colors"
										onSelect={action.onClick}
									>
										{action.label}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</div>
			{/if}
		{/if}
	</div>
</div>
