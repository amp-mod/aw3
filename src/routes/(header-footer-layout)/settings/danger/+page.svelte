<script lang="ts">
	import { enhance } from '$app/forms'
	import { TriangleAlert } from '@lucide/svelte'
	import Button from '$lib/components/Button.svelte'

	let { data, form } = $props()

	let really = $state(false)
</script>

<div class="flex flex-col gap-2">
	<div class="mb-4 flex items-center gap-2 border-b border-black/5 pb-2 dark:border-white/5">
		<TriangleAlert size={20} class="text-neutral-500" />
		<h3 class="text-xl font-semibold">Delete Account</h3>
	</div>

	<div
		class="flex max-w-3xl flex-col gap-3 rounded border border-red-500/50 bg-red-100 p-4 dark:bg-red-900/50"
	>
		<p><strong>Warning: Deleting your account will PERMANENTLY remove:</strong></p>
		<ul class="list-disc pl-4 gap-2 flex flex-col">
			<li>All projects that you created</li>
			<li>All studios you host (unless you transfer them first)</li>
			<li>Your membership in studios</li>
			<li>All comments that you posted, and any of their replies</li>
		</ul>
		<p>
			Your account on the forums will be anonymised, which will preserve your posts but remove most
			data.
		</p>
	</div>
	<p>This cannot be undone. Please enter your password to continue.</p>

	<form method="POST" action="?/delete" use:enhance class="flex max-w-md flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<input
				<input
				type="password"
				name="password"
				id="password"
				placeholder="Password"
				required
				class="rounded border border-black/10 bg-white/5 p-2 outline-none focus:ring-2 focus:ring-amber-500/50 dark:border-white/10"
			/>
		</div>

		{#if really}
			<Button type="submit">REALLY DELETE ACCOUNT?</Button>
		{:else}
			<Button
				onclick={() => {
					really = true
				}}>Delete account</Button
			>
		{/if}
	</form>
</div>
