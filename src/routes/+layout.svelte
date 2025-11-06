<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/header/header.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	class="flex min-h-screen flex-col bg-white text-gray-800 dark:bg-neutral-900 dark:text-gray-100"
>
	<Header />
	<div class="block">
		{@render children?.()}
	</div>
</div>
