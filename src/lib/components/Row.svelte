<script lang="ts">
	let { title, seeMore = null, children } = $props()

	const styles = {
		wrapper:
			'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg h-full overflow-hidden',
		header: 'flex items-center justify-between border-b border-neutral-300 p-2 dark:border-neutral-700',
		label: 'font-bold dark:text-neutral-300 block',
		seeMore:
			'flex items-center gap-1 text-xs font-semibold text-accent dark:text-accent-light transition-colors',
	}
</script>

<div class={styles.wrapper}>
	<div class={styles.header}>
		<span class={styles.label}>{title}</span>

		{#if seeMore}
			<a href={seeMore} class={styles.seeMore}> View All </a>
		{/if}
	</div>

	<div class="flex flex-col gap-3 overflow-x-scroll p-3">
		{@render children()}
	</div>
</div>
