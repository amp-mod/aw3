<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import Footer from '$lib/components/footer.svelte'
	import { afterNavigate } from '$app/navigation'

	let { children, data } = $props()

	// Reference to the scrollable container
	let scrollContainer: HTMLDivElement

	// Every time a navigation completes, reset the scroll
	afterNavigate(() => {
		if (scrollContainer) {
			scrollContainer.scrollTo(0, 0)
		}
	})
</script>

<div class="flex h-screen flex-col">
	<Header {data} />

	<div
		bind:this={scrollContainer}
		class="relative flex flex-1 flex-col overflow-auto scroll-smooth shadow-inner"
	>
		<main class="flex flex-1 flex-col">
			<div>
				{#if data.isDangerousMode}
					<div class="bg-red-700 p-2 text-center text-lg font-bold text-white">
						Your admin panel is currently open to the world wide web, meaning anyone can access it,
						even maliciously. Remove the AW3_FORCE_ADMIN env var to remove this banner.
					</div>
				{/if}
				<noscript>
					<div class="bg-red-700 p-2 text-center text-lg font-bold text-white">
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
