<script lang="ts">
	import Modal from './Modal.svelte'
	import { enhance } from '$app/forms'
	import { afterNavigate, invalidateAll } from '$app/navigation'
	import { browser } from '$app/environment'

	let { open = $bindable(false), required = false }: { open: boolean; required: boolean } = $props()
	let errorMessage = $state('')

	afterNavigate(() => {
		open = false
		errorMessage = ''
	})

	function goBack() {
		if (browser) {
			window.history.back()
		}
	}
</script>

<Modal bind:open title="Login" canClose={!required} forceMount={required}>
	<form
		method="post"
		action="/auth/login"
		use:enhance={() => {
			errorMessage = ''

			return async ({ result }) => {
				if (result.message) {
					errorMessage = result.message ?? 'An error occurred'
				} else if (result.success) {
					open = false
					invalidateAll()
				}
			}
		}}
		class="flex flex-col gap-2"
	>
		{#if required}
			<p>You need to login to access this page.</p>
		{/if}

		{#if errorMessage}
			<div class="rounded bg-amber-100 p-2 text-sm text-red-800 dark:bg-red-700/40 dark:text-white">
				{errorMessage}
			</div>
		{/if}

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">Username</span>
			<input name="username" class="input" required />
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">Password</span>
			<input type="password" name="password" class="input" required />
		</label>

		<p>
			Don't have an account? <a class="link" href="/auth/register">Join today!</a>
		</p>

		<div class="mt-4 flex flex-col gap-2">
			<button type="submit" class="btn btn-primary">Login</button>

			{#if required}
				<button type="button" class="btn btn-secondary" onclick={goBack}> Back </button>
			{/if}
		</div>
	</form>
</Modal>
