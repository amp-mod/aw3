<script>
	import { FileX } from '@lucide/svelte'
	import Footer from './footer/footer.svelte'
	import Button from '$lib/components/Button.svelte'
	let { path = null } = $props()
</script>

<svelte:head>
	<title>Page Unavailable - AmpMod</title>
</svelte:head>

<div class="flex h-screen flex-col">
	<div
		class="mx-auto my-12 flex max-w-3xl grow flex-col items-center justify-center gap-4 text-center"
	>
		<FileX size={64} />
		<p>
			This page is unavailable because a server operator has not set up the AmpMod editor on this
			site properly.
			{#if path}You can access this page on the official site: <a
					class="link"
					href={`https://ampmod.codeberg.page/${path}`}>ampmod.codeberg.page/{path}</a
				>.{/if}
		</p>
		<div class="flex gap-4">
			{#if path}<Button href={`https://ampmod.codeberg.page/${path}`}
					>Access on official site</Button
				>{/if}
			<Button href="/">Back to homepage</Button>
		</div>
	</div>

	<Footer />
</div>
