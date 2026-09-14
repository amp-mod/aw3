<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import Button from '$lib/components/Button.svelte'

	let { data } = $props()

	const expiryDate = data.user.bannedExpiry
		? data.user.bannedExpiry.toLocaleString('en-GB', {
				dateStyle: 'full',
				timeStyle: 'medium',
			})
		: null
	async function logout() {
		try {
			const res = await fetch('/auth/logout', { method: 'POST' })
			if (res.ok) {
				invalidateAll()
			} else {
				console.error('Logout failed')
			}
		} catch (err) {
			console.error(err)
		}
	}
</script>

<svelte:head>
	<title>Banned - AmpMod</title>
</svelte:head>

<div
	class="mx-auto my-12 flex max-w-3xl flex-col gap-3 rounded border border-red-500/50 bg-red-100 p-4 dark:bg-red-900/50"
>
	<p>This account has been blocked from using AmpMod for the following reason:</p>
	<p class="rounded border border-blue-500/50 bg-blue-100 p-3 dark:bg-blue-900/50">
		{data.user.banReason ?? 'No reason provided.'}
	</p>

	{#if data.user.bannedExpiry === null}
		<p>
			If you have any questions or want to appeal this ban, please contact appeals@ampmod.org, or
			ask a parent or guardian to do so. Provide as much info as possible. You may ask questions if
			needed.
		</p>
		<p>
			For the best chance of being unblocked, you should avoid bringing your ban up on other sites.
			Be polite in your appeal.
		</p>
	{:else}
		<p>
			This ban will be automatically lifted on {expiryDate}. Please do not appeal this ban.
		</p>
	{/if}

	<div><Button onclick={logout}>Log out</Button></div>
</div>
