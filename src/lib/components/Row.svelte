<script lang="ts">
	import { m } from '$lib/paraglide/messages'

	let { title, seeMore = null, children, class: htmlClass = null, ...props } = $props()

	const styles = {
		wrapper: 'bg-neutral-100 dark:bg-neutral-800 rounded-xl h-full overflow-hidden shadow-md',
		header: 'flex items-center justify-between py-1 px-6 bg-accent text-white',
		label: 'font-bold text-lg block',
		seeMore: 'flex items-center gap-1 text-xs',
		button: 'text-white font-bold hover:underline text-xs',
	}
</script>

<div class={[styles.wrapper, htmlClass]} {...props}>
	<div class={styles.header}>
		<span class={styles.label}>{title}</span>

		{#if seeMore}
			<a href={seeMore} class={styles.button}>{m.viewAll()}</a>
		{/if}
	</div>

	<div class="flex flex-col gap-3 overflow-x-scroll p-3">
		{@render children()}
	</div>
</div>
