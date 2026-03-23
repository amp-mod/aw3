<script lang="ts">
	import Header from '$lib/components/header/header.svelte'
	import Footer from '$lib/components/footer/footer.svelte'

	let { children, data } = $props()
</script>

<div class="flex h-screen flex-col">
	<Header {data} />

	<div class="relative flex flex-1 flex-col overflow-auto shadow-inner">
		<main class="flex flex-1 flex-col">
			<div>
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
			</div>
		</main>

		<Footer />
	</div>
</div>
