<script lang="ts">
	import Button from './Button.svelte'

	let { title, seeMore = null, children, class: htmlClass = null, ...props } = $props()

	const styles = {
		wrapper:
			'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl h-full overflow-hidden',
		header:
			'flex items-center justify-between border-b border-neutral-300 py-1.5 px-4 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800',
		label: 'font-bold dark:text-neutral-300 text-lg block',
		seeMore: 'flex items-center gap-1 text-xs',
		button: 'bg-accent rounded-full py-1 px-2 text-xs font-bold text-white',
	}
</script>

<div class={[styles.wrapper, htmlClass]} {...props}>
	<div class={styles.header}>
		<span class={styles.label}>{title}</span>

		{#if seeMore}
			<a href={seeMore} class={styles.button}>View All</a>
		{/if}
	</div>

	<div class="flex flex-col gap-3 overflow-x-scroll p-3">
		{@render children()}
	</div>
</div>
