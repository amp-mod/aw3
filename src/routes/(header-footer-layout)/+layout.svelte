<script lang="ts">
	import Header from '$lib/components/header/header.svelte'
	import Footer from '$lib/components/footer/footer.svelte'

	let { children, data } = $props()
</script>

<div class="flex h-screen flex-col">
	<Header {data} />
	<div class="flex-1 overflow-auto shadow-inner" id="main">
		<main>
			{#if data.isDangerousMode}
				<div class="bg-red-700 p-2 text-center text-lg font-bold">
					Your admin panel is currently open to the world wide web, meaning anyone can access it,
					even maliciously. Remove the AW3_FORCE_ADMIN env var to remove this banner.
				</div>
			{/if}
			<noscript>
				<div class="bg-red-700 p-2 text-center text-lg font-bold">
					Enable JavaScript to use most features on AmpMod, including logging in or running
					projects. If you're afraid of remote scripts, download AmpMod on your computer.
				</div>
			</noscript>
			{@render children?.()}
		</main>
		<Footer />
	</div>
</div>
