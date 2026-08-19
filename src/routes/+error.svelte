<script>
	import { page } from '$app/state'
	import Button from '$lib/components/Button.svelte'

	// svelte-ignore non_reactive_update
	let friendlyMessage

	switch (page.status) {
		case 404:
			friendlyMessage = "The page or file you're looking for doesn't exist."
			break
		case 401:
			friendlyMessage = 'You must be logged in to access this page.'
			break
		case 403:
			friendlyMessage = 'You are not allowed to access this page.'
			break
		case 500:
		case 503:
			friendlyMessage =
				'An unknown error occured on the server. Please try reloading in a few minutes.'
			break
		case 429:
			friendlyMessage = 'You are making too many requests to our website.'
			break
		// Why not?
		case 418:
			friendlyMessage = 'This site is a teapot.'
			break
		default:
			friendlyMessage = page.error?.message ?? 'An unknown error occured. Please try again.'
	}
</script>

<svelte:head>
	<title>{page.status} - AmpMod</title>
</svelte:head>

<main class="mx-auto flex h-screen max-w-4xl flex-col justify-center gap-8 text-center">
	<h1 class="font-mono text-8xl font-bold tracking-widest text-red-500 dark:text-red-400">
		{page.status}
	</h1>
	<p class="text-xl font-semibold text-neutral-800 dark:text-white">
		{friendlyMessage}
	</p>
	<div>
		<Button href="/">Back to Home</Button>
	</div>
</main>
