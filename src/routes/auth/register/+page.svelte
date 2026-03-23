<script lang="ts">
	import { browser } from '$app/environment'
	import { Loader, ArrowLeft, TriangleAlert } from '@lucide/svelte'
	import TwAdvanced from './tw-advanced.svelte'
	import type { ActionData, PageData } from './$types'
	import { enhance } from '$app/forms'
	import { deserialize } from '$app/forms'
	import Button from '$lib/components/Button.svelte'

	let { form = $bindable(), data }: { form: ActionData; data: PageData } = $props()

	let step = $state(0)
	let loadingWidget = $state(true)
	let submitting = $state(false)
	let agreedToTerms = $state(false)

	let username = $state('')
	let email = $state('')
	let password = $state('')
	let password2 = $state('')

	let usernameAvailable = $state<boolean | null>(null)
	let unavailableMessage = $state('')
	let checkingUsername = $state(false)

	const isStep1Valid = $derived(username.length >= 3 && usernameAvailable === true)
	const isStep2Valid = $derived(password.length >= 8 && password === password2)

	const stepContent = [
		{
			title: 'Join AmpMod',
			sub: data.isNew
				? 'No account currently exists on this server. This page will create the first account.'
				: 'Start making projects with an AmpMod account!',
		},
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

	const currentHeader = $derived(stepContent[step])

	if (browser) {
		import('altcha').then(() => {
			loadingWidget = false
		})
	}

	$effect(() => {
		if (username.length < 3) {
			usernameAvailable = null
			return
		}

		checkingUsername = true
		const timer = setTimeout(async () => {
			const data = new FormData()
			data.append('username', username)

			const response = await fetch('?/checkUsername', {
				method: 'POST',
				body: data,
				headers: { 'x-sveltekit-action': 'true' },
			})

			const result = deserialize(await response.text())
			if (result.type === 'success') {
				usernameAvailable = result.data?.available ?? false
				unavailableMessage = result.data?.message
			}
			checkingUsername = false
		}, 400)

		return () => clearTimeout(timer)
	})

	const nextStep = () => (step += 1)
	const prevStep = () => (step -= 1)

	const handleEnhance = () => {
		submitting = true
		return async ({ result, update }) => {
			submitting = false
			if (result.type === 'success' || result.type === 'redirect') {
				step = 3
			} else {
				await update()
			}
		}
	}
</script>

<div class="h-screen bg-accent py-32">
	<a href="/" class="fixed top-0 left-0 p-3 text-white" aria-label="Home"><TwAdvanced /></a>

	<div class="relative m-auto max-w-2xl rounded-xl bg-white p-8 shadow dark:bg-neutral-800">
		{#if step > 0 && step < 3}
			<button
				type="button"
				onclick={prevStep}
				class="absolute top-8 left-8 text-neutral-500 transition-colors hover:text-black dark:hover:text-white"
			>
				<ArrowLeft size={20} />
			</button>
		{/if}

		<div class="flex flex-col gap-5">
			{#if step < 3}
				<header class="text-center">
					<h1 class="text-3xl font-bold">{currentHeader.title}</h1>
					<p class="opacity-60">{currentHeader.sub}</p>
				</header>
			{/if}

			{#if step === 0}
				<div class="flex flex-col gap-4">
					<label class="flex flex-col gap-1 font-medium">
						Username
						<div class="relative">
							<input
								bind:value={username}
								type="text"
								class="input w-full"
								placeholder="Pick a unique one"
								autocomplete="username"
							/>
							<div class="absolute top-1/2 right-3 -translate-y-1/2">
								{#if checkingUsername}
									<Loader size={16} class="animate-spin opacity-40" />
								{:else if usernameAvailable === false}
									<div class="rounded-full bg-red-500 p-1 text-white">
										<TriangleAlert size={16} />
									</div>
								{/if}
							</div>
						</div>
						{#if username.length > 0 && username.length < 3}
							<span class="text-xs text-red-500">Too short.</span>
						{:else if usernameAvailable === false}
							<span class="text-xs text-red-500">{unavailableMessage}</span>
						{/if}
					</label>

					<label class="flex flex-col gap-1">
						<span class="font-medium">Email (optional)</span>
						<input
							bind:value={email}
							type="email"
							class="input"
							placeholder="applecat@amphq.secret"
							autocomplete="email"
						/>
					</label>

					<Button type="button" onclick={nextStep} disabled={!isStep1Valid || checkingUsername}>
						Next
					</Button>
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
							autocomplete="new-password"
						/>
					</label>

					<label class="flex flex-col gap-1 font-medium">
						Confirm password
						<input
							bind:value={password2}
							type="password"
							class="input"
							autocomplete="new-password"
						/>
						{#if password2 && password !== password2}
							<span class="text-xs text-red-500">Passwords do not match.</span>
						{/if}
					</label>

					<Button type="button" onclick={nextStep} disabled={!isStep2Valid}>Next</Button>
				</div>
			{/if}

			{#if step === 2}
				<form id="register-form" method="POST" action="?/register" use:enhance={handleEnhance}>
					<input type="hidden" name="username" value={username} />
					<input type="hidden" name="email" value={email} />
					<input type="hidden" name="password" value={password} />
					<altcha-widget
						name="altcha"
						auto="onsubmit"
						challengeurl="/auth/_altcha"
						hidelogo
						hidefooter
					></altcha-widget>
				</form>
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
							I agree to the <a href="/terms" target="_blank" class="link">Terms</a> and
							<a href="/privacy" target="_blank" class="link">Privacy Policy</a>.
						</span>
					</label>

					<Button
						form="register-form"
						type="submit"
						class="flex items-center justify-center gap-2"
						disabled={submitting || loadingWidget || !agreedToTerms}
					>
						{#if submitting}
							<Loader class="h-5 w-5 animate-spin" /> Creating account...
						{:else}
							Join AmpMod
						{/if}
					</Button>
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
					<Button href="/" class="w-full text-center">Check the front page</Button>
				</div>
			{/if}

			{#if form?.message && step < 3}
				<p class="text-center font-medium text-red-500">{form.message}</p>
			{/if}
		</div>
	</div>
</div>
