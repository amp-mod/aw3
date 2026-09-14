<script lang="ts">
	import { enhance } from '$app/forms'
	import { Mail } from '@lucide/svelte'
	import { slide } from 'svelte/transition'
	import Button from '$lib/components/Button.svelte'

	let { data, form } = $props()
</script>

<section>
	<div class="mb-4 flex items-center gap-2 border-b border-black/5 pb-2 dark:border-white/5">
		<Mail size={20} class="text-neutral-500" />
		<h3 class="text-xl font-semibold">Email Address</h3>
	</div>

	<p>Current: {data.email}</p>
	<p>Changing your email will require you to verify it again.</p>

	<form method="POST" action="?/updateEmail" use:enhance class="flex max-w-md flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="email" class="text-sm font-medium">Change email</label>
			<input
				type="email"
				name="email"
				id="email"
				placeholder="you@example.com"
				required
				class="rounded border border-black/10 bg-white/5 p-2 outline-none focus:ring-2 focus:ring-amber-500/50 dark:border-white/10"
			/>
		</div>

		<Button type="submit">Update Email</Button>

		{#if form?.message}
			<p transition:slide class="text-sm text-red-500">
				{form.message}
			</p>
		{/if}

		{#if form?.success}
			<p transition:slide class="text-sm text-green-500">
				Verification link sent to {form.email}.
			</p>
		{/if}
	</form>
</section>
