<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import Footer from '$lib/components/footer.svelte'
	import { afterNavigate } from '$app/navigation'
	import Alert from '$lib/components/Alert.svelte'
	import { MailWarning } from '@lucide/svelte'

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
	{#if data.user && !data.user.isEmailVerified}
		<Alert
			id="email"
			closable={false}
			background="#c11"
			button={{
				url: '/auth/verify',
				text: 'Verify email',
			}}
			icon={MailWarning}
		>
			You can currently only view content. Verify your email to participate in the community!
		</Alert>
	{/if}
	<div
		bind:this={scrollContainer}
		class="relative flex flex-1 flex-col overflow-auto scroll-smooth shadow-inner"
	>
		<main class="flex flex-1 flex-col">
			<div>
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
