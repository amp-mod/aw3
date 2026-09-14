<script lang="ts">
	import { enhance } from '$app/forms'
	import { page } from '$app/state'
	import Button from '$lib/components/Button.svelte'

	// Accept data and form props typed via PageProps
	let { data, form } = $props()

	// Read reset token from the URL query params
	let token = $derived(page.url.searchParams.get('token') ?? '')

	let newPassword = $state('')
	let confirmPassword = $state('')
	let isSubmitting = $state(false)

	// Derived validation state
	let isValidLength = $derived(newPassword.length >= 8)
	let passwordsMatch = $derived(newPassword === confirmPassword)
	let canSubmit = $derived(isValidLength && passwordsMatch && !isSubmitting)
</script>

<svelte:head>
	<title>Set New Password - AmpMod</title>
</svelte:head>

<div class="mx-auto my-8 max-w-md">
	<div
		class="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-neutral-900"
	>
		<h2 class="text-2xl font-bold">Reset Password</h2>

		{#if form?.message}
			<div
				class="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400"
			>
				{form.message}
			</div>
		{/if}

		{#if !token}
			<div
				class="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400"
			>
				Invalid or missing reset token. Please request a new password reset link.
			</div>
		{:else}
			<form
				action="?/resetPassword"
				method="POST"
				class="flex flex-col gap-4"
				use:enhance={() => {
					isSubmitting = true
					return async ({ update }) => {
						isSubmitting = false
						await update()
					}
				}}
			>
				<input type="hidden" name="token" value={token} />

				<div class="flex flex-col gap-1">
					<label for="newPassword" class="text-sm font-medium">New Password</label>
					<input
						id="newPassword"
						type="password"
						name="newPassword"
						bind:value={newPassword}
						required
						minlength="8"
						class="input"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="confirmPassword" class="text-sm font-medium">Confirm Password</label>
					<input
						id="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						required
						class="input"
					/>
				</div>

				{#if confirmPassword && !passwordsMatch}
					<p class="text-xs text-red-500">Passwords do not match.</p>
				{/if}

				<Button type="submit" disabled={!canSubmit}>
					{isSubmitting ? 'Updating...' : 'Reset Password'}
				</Button>
			</form>
		{/if}
	</div>
</div>
