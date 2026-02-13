<script lang="ts">
	import '../app.css'
	import { modals } from '$lib/modals.svelte'
	import favicon from '$lib/assets/favicon.ico'
	import LoginModal from '$lib/components/LoginModal.svelte'
	import { getLocale } from '$lib/paraglide/runtime'

	let { children, data } = $props()
	const dir = ['ar', 'he'].includes(getLocale()) ? 'rtl' : 'ltr'
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>AmpMod</title>
</svelte:head>

<div {dir}>
	{@render children?.()}

	<LoginModal bind:open={modals.login} />

	{#if data?.isDangerousMode}
		<div
			class="pointer-events-none fixed right-4 bottom-4 z-999999 text-xl font-bold text-red-500 opacity-50"
		>
			Insecure
		</div>
	{/if}
</div>
