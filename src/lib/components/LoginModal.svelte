<script lang="ts">
	import Modal from './Modal.svelte'
	import { enhance } from '$app/forms'
	import { afterNavigate, invalidateAll } from '$app/navigation'

	let { open = $bindable(false) }: { open: boolean } = $props()
	let errorMessage = $state('')

	afterNavigate(() => {
		open = false
		errorMessage = ''
	})
</script>

<Modal bind:open title="Login">
	<form
		method="post"
		action="/auth/login"
		use:enhance={() => {
			errorMessage = ''

			return async ({ result }) => {
				if (!result.success) {
					errorMessage = result.message ?? 'An error occurred'
				} else if (result.success) {
					open = false
					invalidateAll()
				}
			}
		}}
		class="flex flex-col gap-2"
	>
		{#if errorMessage}
			<div class="rounded bg-amber-100 p-2 text-sm dark:bg-red-700/40">
				{errorMessage}
			</div>
		{/if}

		<label>
			Username
			<input name="username" class="input" required />
		</label>
		<label>
			Password
			<input type="password" name="password" class="input" required />
		</label>

		<button type="submit" class="btn">Login</button>
		<p>Don't have an account? <a class="link" href="/auth/register">Join today!</a></p>
	</form>
</Modal>
