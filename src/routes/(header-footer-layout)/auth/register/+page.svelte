<script lang="ts">
	import { fade, fly } from 'svelte/transition'
	import {
		Loader,
		ArrowLeft,
		TriangleAlert,
		CircleCheck,
		ChevronRight,
		Mail,
		ShieldCheck,
	} from '@lucide/svelte'
	import { enhance } from '$app/forms'
	import { deserialize } from '$app/forms'
	import Button from '$lib/components/Button.svelte'
	import Scratch from '~icons/simple-icons/scratch'
	import TwAdvanced from './tw-advanced.svelte'
	import type { ActionData, PageData } from './$types'
	import { browser } from '$app/environment'
	import { onDestroy } from 'svelte'
	import MigrateScratchBanner from './migrate-scratch-banner.svg'

	let { form = $bindable(), data }: { form: ActionData; data: PageData } = $props()

	let currentView = $state<
		'choice' | 'credentials' | 'email' | 'scratch-verify' | 'register-form' | 'welcome'
	>('choice')
	let regMode = $state<'standard' | 'scratch'>('standard')
	let submitting = $state(false)

	let username = $state('')
	let email = $state('')
	let password = $state('')
	let password2 = $state('')

	let usernameAvailable = $state<boolean | null>(null)
	let unavailableMessage = $state('')
	let checkingUsername = $state(false)

	const isStep1Valid = $derived(username.length >= 3 && usernameAvailable === true)
	const isStep2Valid = $derived(
		password.length >= 8 && (regMode === 'scratch' || password === password2),
	)

	$effect(() => {
		if (data.scratchStep === 2) {
			currentView = 'scratch-verify'
			regMode = 'scratch'
		}
	})

	$effect(() => {
		if (currentView == 'email' && import.meta.env.VITE_TURNSTILE_SITE_KEY) {
			window.onloadTurnstileCallback = () => {
				if (window.turnstile) {
					turnstileId = window.turnstile.render('#cf-turnstile', {
						sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
						callback: (receivedToken: string) => {
							turnstileToken = receivedToken
						},
					})
				}
			}

			if (window.turnstile) {
				window.onloadTurnstileCallback()
			}
		}

		if (username.length < 3) {
			usernameAvailable = null
			return
		}
		checkingUsername = true
		const timer = setTimeout(async () => {
			const formData = new FormData()
			formData.append('username', username.toLowerCase().trim())
			const response = await fetch('?/checkUsername', {
				method: 'POST',
				body: formData,
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

	const handleEnhance = () => {
		submitting = true
		return async ({ result, update }) => {
			submitting = false
			if (result.type === 'success') {
				if (result.data?.scratchStep === 2) currentView = 'scratch-verify'
				else currentView = 'welcome'
			}
			await update()
		}
	}

	function goBack() {
		if (currentView === 'credentials') currentView = 'choice'
		else if (currentView === 'email') currentView = 'credentials'
	}

	let turnstileId: any
	let turnstileToken = $state('')

	onDestroy(() => {
		if (browser && window.turnstile && turnstileId) {
			window.turnstile.remove(turnstileId)
		}
	})
</script>

<svelte:head>
	{#if import.meta.env.VITE_TURNSTILE_SITE_KEY}
		<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
	{/if}
</svelte:head>

<div class="flex flex-col items-center px-4 py-12">
	<div
		class="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 border-2 border-neutral-500/50"
	>
		{#if currentView === 'choice'}
			<img src={MigrateScratchBanner} alt="" aria-hidden="true" />
		{/if}
		<!-- Top Navigation -->
		<div class="flex shrink-0 items-center px-6 py-2 dark:border-neutral-700">
			{#if currentView !== 'choice' && currentView !== 'welcome' && currentView !== 'scratch-verify'}
				<button
					onclick={goBack}
					class="text-neutral-400 transition-colors hover:text-black dark:hover:text-white"
					aria-label="Back"
				>
					<ArrowLeft size={20} />
				</button>
			{/if}
		</div>

		<div class="flex-1 px-10 py-4">
			{#if currentView === 'choice'}
				<div in:fade={{ duration: 150 }} class="space-y-2">
					<header class="mb-8 flex-col gap-4 flex text-center">
						<h1 class="text-3xl font-bold">Welcome to AmpMod!</h1>
						<p>
							If you have a Scratch account, you can move from Scratch to AmpMod by importing your
							profile.
						</p>
					</header>

					<noscript>You need JavaScript to sign up.</noscript>

					<button
						class="group flex w-full items-center gap-5 rounded-xl border-2 border-orange-500/20 bg-orange-500/5 p-3 text-left transition-all hover:border-orange-500"
						onclick={() => {
							regMode = 'scratch'
							currentView = 'credentials'
						}}
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white transition-transform group-hover:scale-110"
						>
							<Scratch />
						</div>
						<div class="flex-1 flex flex-col gap-1">
							<span class="block text-lg font-bold">Migrate your Scratch account</span>
						</div>
						<ChevronRight class="opacity-30 transition-transform group-hover:translate-x-1" />
					</button>

					<button
						class="group flex w-full items-center gap-5 rounded-xl border-2 border-neutral-100 bg-neutral-50 p-3 text-left transition-all hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900"
						onclick={() => {
							regMode = 'standard'
							currentView = 'credentials'
						}}
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-200 text-neutral-500 transition-transform group-hover:scale-110 dark:bg-neutral-700"
						>
							<TwAdvanced />
						</div>
						<div class="flex-1">
							<span class="block text-lg font-bold">Create account</span>
						</div>
						<ChevronRight class="opacity-30 transition-transform group-hover:translate-x-1" />
					</button>
				</div>
			{:else if currentView === 'credentials'}
				<div in:fly={{ x: 20, duration: 250 }} class="space-y-6">
					<div>
						<h1 class="text-2xl font-bold">
							{regMode === 'scratch' ? 'Scratch username' : 'Create your login'}
						</h1>
						<p class="mt-1 text-sm text-neutral-500">
							{regMode === 'scratch'
								? 'Enter your Scratch username to link accounts. Do not use your Scratch password.'
								: 'Choose a username and password.'}
						</p>
					</div>

					<div class="space-y-4">
						<div class="relative">
							<input
								bind:value={username}
								type="text"
								placeholder={regMode === 'scratch' ? 'Scratch Username' : 'Username'}
								class="w-full rounded-xl border-2 border-neutral-100 p-4 outline-none focus:border-accent dark:border-neutral-700 dark:bg-neutral-900"
							/>
							<div class="absolute top-1/2 right-4 -translate-y-1/2">
								{#if checkingUsername}<Loader size={18} class="animate-spin opacity-40" />
								{:else if usernameAvailable === false}<TriangleAlert
										size={18}
										class="text-red-500"
									/>
								{/if}
							</div>
						</div>

						<input
							bind:value={password}
							type="password"
							placeholder="New password (8+ chars)"
							class="w-full rounded-xl border-2 border-neutral-100 p-4 outline-none focus:border-accent dark:border-neutral-700 dark:bg-neutral-900"
						/>

						{#if regMode === 'standard'}
							<input
								bind:value={password2}
								type="password"
								placeholder="Confirm Password"
								class="w-full rounded-xl border-2 border-neutral-100 p-4 outline-none focus:border-accent dark:border-neutral-700 dark:bg-neutral-900"
							/>
						{/if}
					</div>

					{#if regMode === 'scratch'}
						<form method="POST" action="?/registerScratch" use:enhance={handleEnhance}>
							<input type="hidden" name="username" value={username} /><input
								type="hidden"
								name="password"
								value={password}
							/>
							<Button
								type="submit"
								class="w-full py-4 text-lg"
								disabled={submitting || !isStep2Valid || !isStep1Valid}
							>
								{#if submitting}<Loader class="mx-auto animate-spin" size={20} />{:else}Connect
									Scratch{/if}
							</Button>
						</form>
					{:else}
						<Button
							onclick={() => (currentView = 'email')}
							class="w-full py-4 text-lg"
							disabled={!isStep2Valid || !isStep1Valid}>Next</Button
						>
					{/if}
				</div>
			{:else if currentView === 'email'}
				<div in:fly={{ x: 20, duration: 250 }} class="space-y-6">
					<div>
						<h1 class="text-2xl font-bold">Email</h1>
						<p class="mt-1 text-sm text-neutral-500">
							Optional, but required to reset your password. If you don't set this and you lose your
							account, it will be permanently lost.
						</p>
					</div>

					<div class="relative">
						<Mail class="absolute top-1/2 left-4 -translate-y-1/2 opacity-20" size={20} />
						<input
							bind:value={email}
							type="email"
							placeholder="you@example.com"
							class="w-full rounded-xl border-2 border-neutral-100 p-4 pl-12 outline-none focus:border-accent dark:border-neutral-700 dark:bg-neutral-900"
						/>
					</div>

					<form id="register-form" method="POST" action="?/register" use:enhance={handleEnhance}>
						<input type="hidden" name="username" value={username} /><input
							type="hidden"
							name="turnstileToken"
							value={turnstileToken}
						/><input type="hidden" name="password" value={password} /><input
							type="hidden"
							name="email"
							value={email}
						/>
						{#if import.meta.env.VITE_TURNSTILE_SITE_KEY && browser}
							<div id="cf-turnstile" data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}></div>
						{/if}
						<Button
							type="submit"
							class="w-full py-4 text-lg"
							disabled={submitting || (import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken)}
						>
							{#if submitting}<Loader class="mx-auto animate-spin" size={20} />{:else}Join{/if}
						</Button>
					</form>
				</div>
			{:else if currentView === 'scratch-verify'}
				<div in:fade class="space-y-6 text-center">
					<div
						class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent"
					>
						<ShieldCheck size={32} />
					</div>
					<h1 class="text-2xl font-bold">Post your code</h1>
					<p class="px-4 text-sm leading-relaxed opacity-70">
						To verify you own this account, post this as a comment on your Scratch profile:
					</p>
					<div class="text-left font-mono text-xs">
						{data.verificationComment}
					</div>
					<div class="space-y-3 px-4">
						<form method="POST" action="?/verifyScratch" use:enhance={handleEnhance}>
							<Button type="submit" class="w-full py-4" disabled={submitting}
								>I've posted it!</Button
							>
						</form>
						<form method="POST" action="?/resetScratch">
							<button
								type="submit"
								class="text-xs opacity-40 transition-all hover:text-red-500 hover:opacity-100"
								>Cancel</button
							>
						</form>
					</div>
				</div>
			{:else if currentView === 'welcome'}
				<div
					in:fly={{ y: 20, duration: 400 }}
					class="flex flex-col items-center space-y-6 py-4 text-center"
				>
					<div
						class="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white"
					>
						<CircleCheck size={40} />
					</div>
					<div>
						<h1 class="text-3xl font-bold">Welcome, {username}!</h1>
						<p class="mt-2 text-neutral-500">Ready to start creating projects?</p>
					</div>
					<Button href="/" class="w-full py-4 text-lg">Go to your front page</Button>
				</div>
			{/if}

			{#if form?.message && currentView !== 'welcome'}
				<div
					transition:fade
					class="mt-8 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
				>
					<TriangleAlert size={18} />
					{form.message}
				</div>
			{/if}
		</div>

		<!-- Persistent Footer (Terms) -->
		{#if currentView === 'email' || currentView === 'scratch-verify'}
			<div
				class="border-t border-neutral-100 bg-neutral-50 px-10 py-6 text-center text-[11px] opacity-50 dark:border-neutral-700 dark:bg-neutral-900/50"
			>
				By continuing, you agree to our <a href="/terms" class="underline hover:text-accent"
					>Terms of Service</a
				>
				and
				<a href="/privacy" class="underline hover:text-accent">Privacy Policy</a>.
			</div>
		{/if}
	</div>
</div>
