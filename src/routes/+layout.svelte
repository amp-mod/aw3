<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/header/header.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen flex-col bg-white text-gray-800 dark:bg-neutral-900 dark:text-gray-100">
	<Header />
	<main class="flex-1 overflow-auto">
		{@render children?.()}
	</main>
</div>
