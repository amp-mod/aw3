<script lang="ts">
	import { toasts, removeToast } from '$lib/toast.svelte.ts'
	import { flip } from 'svelte/animate'
	import { fade, fly } from 'svelte/transition'
	import { Info, X, Check, CircleAlert, Loader } from '@lucide/svelte'

	const icons = {
		success: Check,
		failure: CircleAlert,
		loading: Loader,
		normal: Info,
	}
</script>

<div
	class="pointer-events-auto fixed right-4 bottom-4 z-999 flex w-full max-w-sm flex-col gap-2 select-text"
>
	{#each toasts as toast (toast.id)}
		{@const Icon = icons[toast.type]}
		<div
			animate:flip={{ duration: 300 }}
			in:fly={{ y: 20, duration: 300 }}
			out:fade={{ duration: 200 }}
			class="flex items-center gap-3 rounded-lg border p-2 shadow-lg
            {toast.type === 'failure'
				? 'border-red-500/50 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-200'
				: 'border-neutral-300 bg-white/90 dark:border-white/20 dark:bg-accent/90 dark:text-white'}"
		>
			<div class="mt-0.5">
				<Icon class="h-5 w-5 {toast.type === 'loading' ? 'animate-spin' : ''}" />
			</div>

			<p class="flex-1 text-sm font-medium">
				{toast.text}
			</p>

			{#if toast.canClose}
				<button
					onclick={() => removeToast(toast.id)}
					class="rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</div>
	{/each}
</div>
