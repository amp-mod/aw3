<script lang="ts">
	let { children, title } = $props()
</script>

<svelte:head>
	<title>{title} - AmpMod</title>
</svelte:head>

<div class="bg-accent-secondary p-6 text-white">
	<h1 class="m-auto max-w-5xl text-3xl font-bold">{title}</h1>
</div>
<div
	class="text-text m-auto prose max-w-5xl py-4 leading-6 text-black dark:text-white dark:prose-invert prose-a:text-accent dark:prose-a:text-accent-light"
>
	{@render children()}
</div>
