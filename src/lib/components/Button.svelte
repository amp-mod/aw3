<script lang="ts">
	interface Props extends Record<string, any> {
		href?: string
		children?: import('svelte').Snippet
		class?: string
	}

	let { href, children, ...props }: Props = $props()

	const classes = [
		'rounded-lg bg-accent px-4 py-1.5 text-center text-lg font-bold text-white',
		'cursor-pointer disabled:cursor-not-allowed not-disabled:hover:bg-accent-secondary disabled:opacity-70',
	]
</script>

{#if href}
	<a {href} {...props} class={[...classes, props.class]}>
		{@render children?.()}
	</a>
{:else}
	<button {...props} class={[...classes, props.class]}>
		{@render children?.()}
	</button>
{/if}
