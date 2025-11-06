<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from "$lib/components/header/header.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100 min-h-screen flex flex-col">
	<Header />
	<div class="block">
		{@render children?.()}
	</div>
</div>