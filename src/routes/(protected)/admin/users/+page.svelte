<script lang="ts">
	import { enhance } from '$app/forms'
	let { data } = $props()

	const rankNames = {
		0: 'New AmpModder',
		1: 'AmpModder',
		2: 'Moderator',
		3: 'Operator',
	}
</script>

<div
	class="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-accent-secondary"
>
	<div class="overflow-x-auto">
		<table class="w-full text-left dark:text-neutral-300">
			<thead>
				<tr class="border-b border-black/10 dark:border-white/10">
					<th class="pr-4 pb-3 font-semibold">Username</th>
					<th class="pb-3 font-semibold">Rank & Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-black/5 dark:divide-white/5">
				{#each data.users as user}
					<tr>
						<td class="py-4 pr-4 font-medium">{user.username}</td>
						<td class="py-4">
							<form method="POST" action="?/updateRank" use:enhance class="flex items-center gap-3">
								<input type="hidden" name="userId" value={user.id} />

								{#if user.id !== data.user.id || user.rank !== 3}
									<select
										name="rank"
										class="rounded border border-black/20 bg-white px-2 py-1 text-sm dark:border-white/20 dark:bg-transparent"
										value={user.rank}
									>
										{#each Object.entries(rankNames) as [val, label]}
											<option value={val}>{label}</option>
										{/each}
									</select>

									<button
										type="submit"
										class="rounded bg-accent-tertiary px-3 py-1 text-sm font-bold text-white hover:opacity-90 dark:bg-white dark:text-accent-secondary"
									>
										Save
									</button>
								{:else}
									<span
										class="rounded bg-accent/10 px-2 py-1 text-xs font-bold tracking-wider uppercase dark:bg-white/10"
									>
										{rankNames[user.rank ?? 0]} (You)
									</span>
								{/if}
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
