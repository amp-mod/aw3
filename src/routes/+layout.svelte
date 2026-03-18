<script lang="ts">
	import '../app.css'
	import { modals } from '$lib/modals.svelte'
	import favicon from '$lib/assets/favicon.ico'
	import LoginModal from '$lib/components/LoginModal.svelte'
	import { getLocale } from '$lib/paraglide/runtime'
	import SessionRevoked from '$lib/components/SessionRevoked.svelte'
	import { invalidateAll } from '$app/navigation'
	import { onMount } from 'svelte'

	let { children, data } = $props()

	onMount(() => {
		if (data.sessionDeleted) {
			console.warn('Session has been deleted!')
			invalidateAll().then(() => (modals.sessionRevoked = true))
		}
		console.warn(
			'%cSTOP NOW!%cPasting code here can allow an attacker to LOG IN to your account. Read the AmpMod FAQ for more information.',
			'font-size: 3em; font-weight: bold; display: block; font-family: sans-serif;',
			'font-size: 1.5em; font-weight: bold; font-family: sans-serif;',
		)
	})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>AmpMod</title>
</svelte:head>

{@render children?.()}

<LoginModal bind:open={modals.login} />
<SessionRevoked bind:open={modals.sessionRevoked} />

{#if data?.isDangerousMode}
	<div
		class="pointer-events-none fixed right-4 bottom-4 z-999999 text-xl font-bold text-red-500 opacity-50"
	>
		Insecure
	</div>
{/if}
