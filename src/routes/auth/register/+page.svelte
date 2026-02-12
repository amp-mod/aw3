<script lang="ts">
	import { enhance } from '$app/forms'
	import type { ActionData } from './$types'
	import { browser } from '$app/environment'
	import { Loader, ArrowLeft, CheckCircle2 } from '@lucide/svelte'
	import TwAdvanced from '$lib/components/header/tw-advanced.svelte'

	let { form }: { form: ActionData } = $props()

	let step = $state(0)
	let loadingWidget = $state(true)
	let submitting = $state(false)
	let agreedToTerms = $state(false)

	let username = $state('')
	let email = $state('')
	let password = $state('')
	let password2 = $state('')

	const isStep1Valid = $derived(username.length >= 3)
	const isStep2Valid = $derived(password.length >= 8 && password === password2)

	const stepContent = [
		{ title: 'Join AmpMod', sub: 'Start making projects with an AmpMod account!' },
		{
			title: 'Set your password',
			sub: "Treat your password like a toothbrush. Don't let other people have it, and get a new one every few months.",
		},
		{
			title: 'Boring but important',
			sub: 'In a world where villains exist, there must be rules to stop them. The terms of service and privacy policy are one of those rules.',
		},
		'custom',
	]

	const currentHeader = $derived(stepContent[step] ?? stepContent[0])

	$effect(() => {
		if (form?.success) {
			step = 3
		}
	})

	if (browser) {
		import('altcha').then(() => {
			loadingWidget = false
		})
	}

	const nextStep = () => (step += 1)
	const prevStep = () => (step -= 1)
</script>

<div class="h-screen bg-accent py-32">
	<a href="/" class="fixed top-0 left-0 p-3 text-white" aria-label="Home"><TwAdvanced /></a>

	<div class="relative m-auto max-w-2xl rounded-xl bg-white p-8 shadow dark:bg-neutral-800">
		{#if step > 0 && step < 3}
			<button
				type="button"
				onclick={prevStep}
				class="absolute top-8 left-8 text-neutral-500 transition-colors hover:text-black dark:hover:text-white"
				aria-label="Go back"
			>
				<ArrowLeft size={20} />
			</button>
		{/if}

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
			<input type="hidden" name="username" value={username} />
			<input type="hidden" name="email" value={email} />
			<input type="hidden" name="password" value={password} />

			{#if currentHeader !== 'custom'}
				<header class="text-center">
					<h1 class="text-3xl font-bold">{currentHeader.title}</h1>
					<p class="opacity-60">{currentHeader.sub}</p>
				</header>
			{/if}

			{#if step === 0}
				<div class="flex flex-col gap-4">
					<label class="flex flex-col gap-1 font-medium">
						Username
						<input
							bind:value={username}
							type="text"
							class="input"
							placeholder="Pick a unique one"
							required
						/>
						{#if username && username.length < 3}
							<span class="text-xs text-red-500">Username must be at least 3 characters.</span>
						{/if}
					</label>

					<label class="flex flex-col gap-1">
						<span class="font-medium">Email</span>
						<input bind:value={email} type="email" class="input" placeholder="you@example.com" />
						<p class="text-sm opacity-60">
							<b>Important!</b> Email is optional but if you lose an account without an email, you will
							be unable to get it back.
						</p>
					</label>

					<button type="button" onclick={nextStep} class="btn" disabled={!isStep1Valid}>
						Next
					</button>
				</div>
			{/if}

			{#if step === 1}
				<div class="flex flex-col gap-4">
					<label class="flex flex-col gap-1 font-medium">
						Password
						<input
							bind:value={password}
							type="password"
							class="input"
							placeholder="Minimum 8 characters"
							required
						/>
					</label>

					<label class="flex flex-col gap-1 font-medium">
						Confirm password
						<input bind:value={password2} type="password" class="input" required />
						{#if password2 && password !== password2}
							<span class="text-xs text-red-500">Passwords do not match.</span>
						{/if}
					</label>

					<button type="button" onclick={nextStep} class="btn" disabled={!isStep2Valid}>
						Next
					</button>
				</div>
			{/if}

			{#if step === 2}
				<div class={loadingWidget ? 'pointer-events-none opacity-50' : ''}>
					<altcha-widget auto="onsubmit" challengeurl="/auth/_altcha" hidelogo hidefooter
					></altcha-widget>
				</div>

				<div class="flex flex-col gap-6">
					<label
						class="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700/30"
					>
						<input
							type="checkbox"
							bind:checked={agreedToTerms}
							class="mt-1 h-5 w-5 rounded border-gray-300 accent-accent"
						/>
						<span class="text-sm leading-relaxed">
							I agree to the
							<a href="/terms" class="link" target="_blank" onclick={(e) => e.stopPropagation()}
								>AmpMod Terms of Service</a
							>
							and the
							<a href="/privacy" class="link" target="_blank" onclick={(e) => e.stopPropagation()}
								>AmpMod Privacy Policy</a
							>. Note: these are <em>not</em> legally binding contracts.
						</span>
					</label>

					<button
						type="submit"
						class="btn flex items-center justify-center gap-2"
						disabled={submitting || loadingWidget || !agreedToTerms}
					>
						{#if submitting}
							<Loader class="h-5 w-5 animate-spin" />
							Creating account...
						{:else}
							Join AmpMod
						{/if}
					</button>
				</div>
			{/if}

			{#if step === 3}
				<div class="flex flex-col items-center gap-6 py-4">
					<div class="text-center">
						<p class="text-lg font-semibold">Welcome to AmpMod, {username}!</p>
						<p class="opacity-60">
							Your account has been created. Your profile page has been published and you can now
							create your own projects.
						</p>
					</div>
					<a href="/" class="btn w-full text-center">Check the front page</a>
				</div>
			{/if}

			{#if form?.message && step < 3}
				<p class="text-center font-medium text-red-500" aria-live="polite">
					{form.message}
				</p>
			{/if}
		</form>
	</div>
</div>
