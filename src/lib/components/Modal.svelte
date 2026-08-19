<script lang="ts">
	import { Dialog } from 'bits-ui'
	import { X } from '@lucide/svelte'

	let {
		open = $bindable(false),
		title = '',
		canClose = true,
		children,
		forceMount = false,
	} = $props()
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" {forceMount} />

		<Dialog.Content
			class="not-xl:h-[calc(100% - 12px)] fixed top-[50%] left-[50%] z-50 w-full max-w-150 translate-x-[-50%] overflow-auto rounded-xl bg-white shadow-[0px_0px_0px_4px_rgba(0,0,0,0.05)] outline-none not-xl:translate-x-[-50%] not-xl:translate-y-[-50%] xl:top-20 dark:bg-neutral-900 dark:shadow-[0px_0px_0px_4px_rgba(255,255,255,0.1)]"
			escapeKeydownBehavior={canClose ? 'close' : 'ignore'}
			interactOutsideBehavior={canClose ? 'close' : 'ignore'}
			onOpenAutoFocus={(e) => e.preventDefault()}
			{forceMount}
		>
			<div
				class="relative flex h-10 items-center justify-between border-b border-b-black/10 px-4 dark:border-b-transparent dark:bg-accent"
			>
				<Dialog.Title class="font-semibold whitespace-nowrap text-neutral-800 dark:text-white">
					{title}
				</Dialog.Title>

				{#if canClose}
					<Dialog.Close
						class="ml-auto cursor-pointer rounded-full bg-black/10 p-2 text-neutral-900 transition-all hover:scale-120 dark:text-white"
					>
						<X size={12} strokeWidth={5} />
					</Dialog.Close>
				{/if}
			</div>

			<div class="max-h-[80vh] overflow-y-auto p-6">
				{@render children()}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
