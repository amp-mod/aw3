<script lang="ts">
	import { UserRound } from '@lucide/svelte'
	import { getPfpPath } from '$lib/storage-helpers'

	// Define props for the component
	let { users = [], emptyMessage = 'No users found.' } = $props()

	const styles = {
		grid: 'flex flex-wrap gap-4 mt-2',
		card: 'group flex flex-col gap-2 rounded-xl p-1 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800/50 w-18 items-center',
		pfp: 'h-14 w-14 shrink-0 overflow-hidden rounded border-2 border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900',
		username: 'px-1 text-xs font-bold truncate w-full dark:text-neutral-200',
		privateBadge:
			'flex items-center justify-center gap-1 text-[9px] font-bold uppercase text-amber-600',
	}
</script>

<div class={styles.grid}>
	{#each users as user (user.username)}
		<a href="/users/{user.username}" class={styles.card}>
			<div class={styles.pfp}>
				<img
					src={getPfpPath(user)['64']}
					alt={user.username}
					class="h-full w-full object-cover"
					loading="lazy"
				/>
			</div>

			<div class="flex w-full flex-col gap-0.5">
				<span class={styles.username}>{user.username}</span>
			</div>
		</a>
	{:else}
		<p class="text-xs italic text-neutral-500 py-4">{emptyMessage}</p>
	{/each}
</div>
