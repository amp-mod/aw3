<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from "$lib/components/header/header.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="bg-background dark:bg-background-dark text-text dark:text-text-dark min-h-screen flex flex-col">
	<Header />
	<div class="block">
		{@render children?.()}
	</div>
</div>