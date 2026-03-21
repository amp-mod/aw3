<script lang="ts">
	let { title, seeMore = null, children } = $props()

	const styles = {
		wrapper:
			'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 h-full',
		header: 'mb-4 flex items-center justify-between border-b pb-2 dark:border-neutral-700',
		label: 'font-bold text-accent-secondary dark:text-neutral-300 block tracking-tight',
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

	<div class="flex flex-col gap-3 overflow-x-scroll">
		{@render children()}
	</div>
</div>
