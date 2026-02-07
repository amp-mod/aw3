<script lang="ts">
	import '../app.css'
	import { modals } from '$lib/modals.svelte'
	import favicon from '$lib/assets/favicon.ico'
	import LoginModal from '$lib/components/LoginModal.svelte'

	let { children, data } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>AmpMod</title>
</svelte:head>

{@render children?.()}

<LoginModal bind:open={modals.login} />

{#if data?.isDangerousMode}
	<div
		class="pointer-events-none fixed right-4 bottom-4 z-999999 text-xl font-bold text-red-500 opacity-50"
	>
		Insecure
	</div>
{/if}
