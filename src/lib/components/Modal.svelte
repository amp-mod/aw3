<script lang="ts">
	import { Dialog } from 'bits-ui'
	import { X } from '@lucide/svelte'
	import { scale, fade } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'

	let { open = $bindable(false), title = '', canClose = true, children } = $props()
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay forceMount>
			{#snippet child({ props, open: isOpen })}
				{#if isOpen}
					<div
						{...props}
						class="fixed inset-0 z-50 bg-black/60"
						transition:fade={{ duration: 200 }}
					></div>
				{/if}
			{/snippet}
		</Dialog.Overlay>

		<Dialog.Content
			forceMount
			restoreScrollDelay={200}
			escapeKeydownBehavior={canClose ? 'close' : 'ignore'}
			interactOutsideBehavior={canClose ? 'close' : 'ignore'}
			onOpenAutoFocus={(e) => e.preventDefault()}
		>
			{#snippet child({ props, open: isOpen })}
				{#if isOpen}
					<div
						{...props}
						class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-neutral-200/80 bg-white py-3 px-5 shadow-2xl dark:border-neutral-800/80 dark:bg-neutral-900"
						transition:scale={{ duration: 200, start: 0.15, easing: cubicOut }}
					>
						<!-- Header -->
						<div class="flex items-center justify-between pb-2">
							<Dialog.Title
								class="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100"
							>
								{title}
							</Dialog.Title>

							{#if canClose}
								<Dialog.Close
									class="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
								>
									<X size={18} />
								</Dialog.Close>
							{/if}
						</div>

						<!-- Body -->
						<div class="overflow-y-auto pt-2 text-neutral-600 dark:text-neutral-300">
							{@render children?.()}
						</div>
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
