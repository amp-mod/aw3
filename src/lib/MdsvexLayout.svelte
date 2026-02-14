<script lang="ts">
	let { children, title } = $props()
</script>

<svelte:head>
	<title>{title} - AmpMod</title>
</svelte:head>

<div class="bg-accent-secondary p-8 text-center text-white">
	<h1 class="text-3xl font-bold">{title}</h1>
</div>
<div
	class="text-text m-auto prose max-w-4xl p-8 dark:prose-invert prose-a:text-accent dark:prose-a:text-accent-light"
>
	{@render children()}
</div>
