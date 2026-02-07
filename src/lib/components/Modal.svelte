<script lang="ts">
	import { Dialog } from 'bits-ui'
	import { X } from '@lucide/svelte'

	let { open = $bindable(false), title = '', children } = $props()
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-accent/70 backdrop-blur-[2px] dark:bg-neutral-500/40"
		/>

		<Dialog.Content
			class="fixed top-[120px] left-[50%] z-50 w-full max-w-[600px] translate-x-[-50%] overflow-hidden rounded bg-white shadow-[0px_0px_0px_4px_rgba(0,0,0,0.05)] outline-none dark:bg-neutral-900 dark:shadow-[0px_0px_0px_4px_rgba(255,255,255,0.1)]"
		>
			<div
				class="relative flex h-12.5 items-center justify-between border-b border-b-black/10 px-4 dark:border-b-transparent dark:bg-accent"
			>
				<Dialog.Title
					class="absolute left-1/2 -translate-x-1/2 font-semibold whitespace-nowrap text-neutral-800 dark:text-white"
				>
					{title}
				</Dialog.Title>

				<Dialog.Close
					class="ml-auto cursor-pointer rounded-full bg-black/10 p-2 text-neutral-900 transition-all hover:scale-120   dark:text-white"
				>
					<X size={12} strokeWidth={5} />
				</Dialog.Close>
			</div>

			<div class="max-h-[80vh] overflow-y-auto p-6">
				{@render children()}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
