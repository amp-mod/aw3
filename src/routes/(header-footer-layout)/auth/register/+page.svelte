<script lang="ts">
	import { enhance } from '$app/forms'
	import type { ActionData } from './$types'
	import { browser } from '$app/environment'
	import { Loader } from '@lucide/svelte'

	let { form }: { form: ActionData } = $props()

	let loadingWidget = $state(true)
	let submitting = $state(false)

	// Load Altcha only on the client
	if (browser) {
		import('altcha').then(() => {
			loadingWidget = false
		})
	}
</script>

<div class="m-auto max-w-2xl px-4 py-8">
	<form
		method="POST"
		action="?/register"
		use:enhance={() => {
			submitting = true
			return async ({ update }) => {
				await update()
				submitting = false
			}
		}}
		class="flex flex-col gap-5"
	>
		<h1 class="text-3xl font-bold">Join AmpMod</h1>

		<div class="flex flex-col gap-4">
			<label class="flex flex-col gap-1 font-medium">
				Username
				<input
					name="username"
					type="text"
					class="input"
					placeholder="Pick a unique one"
					required
					autocomplete="username"
				/>
			</label>

			<label class="flex flex-col gap-1 font-medium">
				Password
				<input
					name="password"
					type="password"
					class="input"
					placeholder="Treat them like your toothbrush"
					required
					minlength="8"
					autocomplete="new-password"
				/>
			</label>

			<label class="flex flex-col gap-1 font-medium">
				Confirm password
				<input
					name="password2"
					type="password"
					class="input"
					required
					minlength="8"
					autocomplete="new-password"
				/>
			</label>
		</div>

		<p>We are robots, and we need to verify you so we can make sure you're not one of us.</p>
		<altcha-widget auto="onsubmit" challengeurl="/auth/_altcha" hidefooter hidelogo></altcha-widget>

		<button
			type="submit"
			class="btn rounded bg-blue-600 p-3 font-semibold text-white disabled:opacity-50"
			disabled={submitting || loadingWidget}
		>
			{submitting ? 'Creating account...' : 'Register'}
		</button>

		{#if form?.message}
			<p class="text-center font-medium text-red-500" aria-live="polite">
				{form.message}
			</p>
		{/if}
	</form>
</div>
