<script lang="ts">
	interface Props extends Record<string, any> {
		href?: string
		children?: import('svelte').Snippet
		class?: string
	}

	let { href, children, ...props }: Props = $props()
</script>

{#if href}
	<a
		{href}
		{...props}
		class={[
			'rounded-lg bg-accent px-4 py-2 text-center text-lg font-bold text-white',
			'not-disabled:cursor-pointer not-disabled:hover:bg-accent-secondary disabled:opacity-70',
			props.class,
		]}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		{...props}
		class={[
			'rounded-lg bg-accent px-4 py-2 text-center text-lg font-bold text-white',
			'not-disabled:cursor-pointer not-disabled:hover:bg-accent-secondary disabled:opacity-70',
			props.class,
		]}
	>
		{@render children?.()}
	</button>
{/if}
