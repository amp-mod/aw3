<script lang="ts">
	import Button from './Button.svelte'

	let { title, seeMore = null, children, class: htmlClass = null, ...props } = $props()

	const styles = {
		wrapper:
			'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl h-full overflow-hidden',
		header:
			'flex items-center justify-between border-b border-neutral-300 py-2 px-6 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800',
		label: 'font-bold dark:text-neutral-300 text-lg block',
		seeMore: 'flex items-center gap-1 text-xs',
	}
</script>

<div class={[styles.wrapper, htmlClass]} {...props}>
	<div class={styles.header}>
		<span class={styles.label}>{title}</span>

		{#if seeMore}
			<Button href={seeMore} class={styles.seeMore}>View All</Button>
		{/if}
	</div>

	<div class="flex flex-col gap-3 overflow-x-scroll p-3">
		{@render children()}
	</div>
</div>
