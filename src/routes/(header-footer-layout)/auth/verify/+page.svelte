<script>
	import { enhance } from '$app/forms'
	import Button from '$lib/components/Button.svelte'
	import { m } from '$lib/paraglide/messages'

	let { data, form } = $props()

	// Step 1: Input email | Step 2: Verification email sent
	let step = $state(data.hasEmail ? 2 : 1)
	let currentEmail = $state(data.email ?? '')

	// Dynamic UI updates when form actions return
	$effect(() => {
		if (form?.success) {
			step = 2
			if (form.email) currentEmail = form.email
		}
		if (form?.cleared) {
			step = 1
			currentEmail = ''
		}
	})
</script>

<div class="my-8 mx-auto max-w-2xl">
	<div
		class="bg-white dark:bg-neutral-900 p-6 rounded-xl border-black/10 dark:border-white/10 border flex flex-col gap-4"
	>
		{#if form?.message}
			<div
				class="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm"
			>
				{form.message}
			</div>
		{/if}

		{#if step === 1}
			<h2 class="text-2xl font-bold">{m.verifyYourEmail()}</h2>

			<form action="?/sendVerification" method="POST" class="flex gap-3 items-center" use:enhance>
				<input
					type="email"
					name="email"
					bind:value={currentEmail}
					class="input flex-1"
					placeholder=""
					required
				/>
				<div><Button type="submit">{m.sendLink()}</Button></div>
			</form>
		{:else}
			<p>
				{m.emailSent({ currentEmail })}
			</p>
			<p>
				{m.emailSent2()}
			</p>

			<div class="flex items-center gap-4 mt-2">
				<!-- Resend Email -->
				<form action="?/sendVerification" method="POST" use:enhance>
					<input type="hidden" name="email" value={currentEmail} />
					<Button type="submit">{m.resendEmail()}</Button>
				</form>

				<!-- Clear / Change Email -->
				<form action="?/clearEmail" method="POST" use:enhance>
					<Button type="submit">{m.wrongEmail()}</Button>
				</form>
			</div>
		{/if}
	</div>
</div>

<svelte:head>
	<title>Verify your email - AmpMod</title>
</svelte:head>
