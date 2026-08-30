<script lang="ts">
	import { enhance } from '$app/forms'
	import { reportReasons } from '$lib/report-reasons.js'
	let { data } = $props()
</script>

<form method="GET" action="/admin/reports" class="m-auto flex items-center gap-4 p-4">
	<input name="report" type="number" class="input" placeholder="Go to report ID..." />
</form>

<div
	class="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-accent-secondary"
>
	<div class="overflow-x-auto">
		<table class="w-full text-left dark:text-neutral-300">
			<thead>
				<tr class="border-b border-black/10 dark:border-white/10">
					<th class="py-2">Item</th>
					<th class="py-2">Reason</th>
					<th class="py-2">Description</th>
					<th class="py-2">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-black/5 dark:divide-white/5">
				{#each data.reports as report}
					<tr>
						<td class="py-4 pr-4">
							{#if report.itemType === 'project'}
								<a href="/projects/{report.itemId}" class="underline hover:opacity-80"
									>Project #{report.itemId}</a
								>
							{:else if report.itemType === 'user'}
								<a href="/admin/users" class="underline hover:opacity-80">@{report.itemId}</a>
							{:else if report.itemType === 'gallery'}
								<a href="/galleries/{report.itemId}" class="underline hover:opacity-80"
									>Gallery #{report.itemId}</a
								>
							{:else}
								{report.itemId}
							{/if}
						</td> <td class="py-4 pr-4">{reportReasons[report.itemType][report.chosenReason]}</td>
						<td class="py-4 pr-4">{report.description ?? 'No description'}</td>
						<td class="py-4">
							<form method="POST" action="?/finishReport" use:enhance>
								<input type="hidden" name="reportId" value={report.id} />
								<button
									type="submit"
									class="rounded bg-accent-tertiary px-3 py-1 text-sm font-bold text-white hover:opacity-90 dark:bg-white dark:text-accent-secondary"
								>
									Resolve
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if data.totalPages > 1}
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
{/if}
