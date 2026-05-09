<script lang="ts">
	import { X, Search } from '@lucide/svelte'
	import { fade, fly } from 'svelte/transition'

	let { onclose, bindValue = $bindable() } = $props()

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose()
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	transition:fade={{ duration: 200 }}
	class="fixed inset-0 z-[100] flex flex-col bg-white p-6 dark:bg-accent"
>
	<div class="flex justify-end">
		<button onclick={onclose} class="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
			<X size={32} />
		</button>
	</div>

	<div transition:fly={{ y: 20, duration: 300 }} class="m-auto w-full max-w-2xl">
		<form action="/search" class="relative">
			<Search class="absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400" size={24} />
			<input
				autoFocus
				type="search"
				name="q"
				bind:value={bindValue}
				placeholder="Search projects..."
				class="w-full border-b-2 border-neutral-300 bg-transparent py-4 pl-14 text-4xl outline-none focus:border-accent-secondary dark:border-white/20"
			/>
		</form>
	</div>
</div>
