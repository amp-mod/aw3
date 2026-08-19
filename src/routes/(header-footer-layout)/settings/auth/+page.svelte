<script lang="ts">
	import { enhance } from '$app/forms'
	import { Lock, ShieldCheck, Fingerprint, Trash2, Smartphone } from '@lucide/svelte'
	import { slide } from 'svelte/transition'
	import Button from '$lib/components/Button.svelte'
	import { startRegistration } from '@simplewebauthn/browser'

	let { data, form } = $props()
	let passkeyError = $state('')

	async function handleAddPasskey() {
		passkeyError = ''
		try {
			// 1. Fetch registration options from your server
			const resp = await fetch('/settings/auth/registrationOptions')
			const options = await resp.json()

			// 2. Start the browser ceremony (Firefox will show the "Insert Key" prompt)
			const regResult = await startRegistration({ optionsJSON: options })

			// 3. Send the result back to verify and save
			const verifyResp = await fetch('/api/auth/passkey/verify', {
				method: 'POST',
				body: JSON.stringify(regResult),
			})

			if (verifyResp.ok) {
				location.reload() // Refresh to show the new key
			} else {
				passkeyError = 'Verification failed on server.'
			}
		} catch (err: any) {
			passkeyError = err.message || 'Failed to register passkey.'
		}
	}
</script>

<section>
	<div class="mb-4 flex items-center gap-2 border-b border-black/5 pb-2 dark:border-white/5">
		<Lock size={20} class="text-neutral-500" />
		<h3 class="text-xl font-semibold">Security</h3>
	</div>

	<form method="POST" action="?/updatePassword" use:enhance class="flex max-w-md flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<label for="currentPassword" class="text-sm font-medium">Current Password</label>
			<input
				type="password"
				name="currentPassword"
				required
				class="rounded border border-black/10 bg-white/5 p-2 outline-none focus:ring-2 focus:ring-amber-500/50 dark:border-white/10"
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="newPassword" class="text-sm font-medium">New Password</label>
			<input
				type="password"
				name="newPassword"
				required
				class="rounded border border-black/10 bg-white/5 p-2 outline-none focus:ring-2 focus:ring-amber-500/50 dark:border-white/10"
			/>
		</div>

		<Button type="submit">Update Password</Button>
		{#if form?.passwordSuccess}<p transition:slide class="text-sm text-green-500">
				Updated successfully.
			</p>{/if}
	</form>
</section>

<!--
<section>
	<div class="mb-4 flex items-center gap-2 border-b border-black/5 pb-2 dark:border-white/5">
		<ShieldCheck size={20} class="text-neutral-500" />
		<h3 class="text-xl font-semibold">Two-Factor Authentication</h3>
	</div>

	{#if data.user.twoFactorEnabled}
		<div
			class="flex items-center justify-between rounded border border-green-500/20 bg-green-500/5 p-4"
		>
			<div class="flex items-center gap-4">
				<ShieldCheck class="text-green-500" size={24} />
				<span class="text-sm font-medium">2FA is currently active</span>
			</div>
			<form method="POST" action="?/disable2FA" use:enhance>
				<Button type="submit" class="bg-red-500/10 text-red-600 hover:bg-red-500/20">Disable</Button
				>
			</form>
		</div>
	{:else}
		<div
			class="flex items-center justify-between rounded border border-black/5 p-4 dark:border-white/5"
		>
			<div class="flex flex-col text-sm">
				<span class="font-medium">Authenticator App</span>
				<span class="text-neutral-500">Use an app like Aegis or Bitwarden to get codes.</span>
			</div>
			<Button href="/settings/auth/2fa-setup">Configure</Button>
		</div>
	{/if}
</section>

<section>
	<div class="mb-4 flex items-center gap-2 border-b border-black/5 pb-2 dark:border-white/5">
		<Fingerprint size={20} class="text-neutral-500" />
		<h3 class="text-xl font-semibold">Passkeys</h3>
	</div>

	<div class="space-y-3">
		{#each data.user.passkeys || [] as key}
			<div
				class="flex items-center justify-between rounded border border-black/5 p-4 dark:border-white/5"
				transition:slide
			>
				<div class="flex items-center gap-4">
					<Smartphone size={20} class="text-neutral-400" />
					<div class="flex flex-col">
						<span class="text-sm font-medium">{key.name}</span>
						<span class="text-xs text-neutral-500">Used {key.lastUsed}</span>
					</div>
				</div>
				<form method="POST" action="?/deletePasskey" use:enhance>
					<input type="hidden" name="id" value={key.id} />
					<button type="submit" class="text-neutral-400 hover:text-red-500"
						><Trash2 size={18} /></button
					>
				</form>
			</div>
		{/each}

		<div
			class="rounded-lg border border-dashed border-black/10 p-6 text-center dark:border-white/10"
		>
			<Button variant="secondary" onclick={handleAddPasskey}>Register New Passkey</Button>
			{#if passkeyError}
				<p class="mt-2 text-xs text-red-500">{passkeyError}</p>
			{/if}
		</div>
	</div>
</section>
-->
