<script lang="ts">
	import { enhance } from '$app/forms'
	let { data } = $props()
	import { rankMap } from '$lib/ranks'
	import { getPfpPath } from '$lib/storage-helpers'
</script>

<form method="GET" action="/admin/users" class="m-auto flex items-center gap-4 p-4">
	<input name="user" type="text" class="input" placeholder="Go to user...	" />
</form>
<div
	class="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-accent-secondary"
>
	<div class="overflow-x-auto">
		<table class="w-full text-left dark:text-neutral-300">
			<tbody class="divide-y divide-black/5 dark:divide-white/5">
				{#each data.users as user}
					<tr>
						<td class="py-4">
							<img
								src={getPfpPath(user)['full']}
								class="h-16"
								alt="The profile picture of {user.username}"
								loading="lazy"
							/>
						</td>
						<td class="py-4 pr-4"
							><a class="font-bold underline" href="?user={user.username}">{user.username}</a> (<a
								href="/users/{user.username}"
								class="underline">Profile</a
							>)<br />
							<p>Created {user.createdAt.toLocaleDateString()}</p></td
						>
						<td class="py-4">
							<form method="POST" action="?/updateRank" use:enhance class="flex items-center gap-3">
								<input type="hidden" name="userId" value={user.id} />

								{#if user.id !== data.user.id || user.rank !== 3}
									<select
										name="rank"
										class="rounded border border-black/20 bg-white px-2 py-1 text-sm dark:border-white/20 dark:bg-transparent"
										value={user.rank}
									>
										{#each Object.entries(rankMap) as [val, label]}
											<option value={+val}>{label}</option>
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
										class="rounded bg-accent/10 px-2 py-1 text-xs font-bold tracking-wider dark:bg-white/10"
									>
										{rankMap[user.rank ?? 0]} (You)
									</span>
								{/if}
							</form>
						</td><td class="w-96 py-4">
							<form
								action="?/updatePassword"
								method="POST"
								use:enhance
								class="flex items-center gap-3"
							>
								<input type="hidden" name="userId" value={user.id} />
								<span>Password:</span>
								<input type="password" name="newPassword" class="input" />
								<button
									type="submit"
									class="rounded bg-accent-tertiary px-3 py-1 text-sm font-bold text-white hover:opacity-90 dark:bg-white dark:text-accent-secondary"
								>
									Save
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<div class="m-auto flex gap-4 p-5">
	{#each Array.from({ length: data.totalPages }, (_, i) => i + 1) as pageNum}
		<a
			href="?p={pageNum}"
			class="mx-1 rounded px-3 py-1 text-sm font-bold text-white hover:opacity-90 dark:bg-white dark:text-accent-secondary {pageNum ===
			data.page
				? 'bg-accent'
				: 'bg-accent/10'}"
		>
			{pageNum}
		</a>
	{/each}
</div>
