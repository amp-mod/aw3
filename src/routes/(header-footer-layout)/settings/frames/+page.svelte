<script lang="ts">
	import { enhance } from '$app/forms'
	import PFP from '$lib/components/PFP.svelte'
	import { frames } from '$lib/frames'

	let { data } = $props()

	const frameOptions = $derived([
		{
			...data.user,
			frame: '',
			frameLabel: 'No frame',
		},
		...Object.keys(frames).map((f) => ({
			...data.user,
			frame: f,
			frameLabel: f,
		})),
	])
</script>

<h2 class="mb-2 text-3xl font-bold">Frames</h2>
<p class="mb-2">Add a cool frame to your profile picture!</p>
<p class="mb-2">
	If you want to stand out more, you can pick the main colour of a frame and make it the background
	for your profile picture.
</p>
<p class="mb-6">
	Frames are experimental. Available frames may change or be removed without notice, and you may see
	glitches in some places.
</p>

<div class="grid grid-cols-3 gap-4">
	{#each frameOptions as h}
		{@const isSelected = (data.user?.frame ?? '') === h.frame}
		<form
			method="POST"
			action="?/setFrame"
			use:enhance={() => {
				return async ({ update }) => {
					await update()
				}
			}}
		>
			<input type="hidden" name="frame" value={h.frame} />

			<button
				type="submit"
				class="group flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded border p-4 transition-all focus:ring-2 focus:ring-accent focus:outline-none disabled:cursor-default {isSelected
					? 'border-accent bg-accent/10 dark:border-accent-light dark:bg-accent/20'
					: 'border-black/5 hover:border-black/20 dark:border-white/5 dark:bg-neutral-800/50 dark:hover:border-white/20'}"
				disabled={isSelected}
			>
				<div class="transition-transform duration-150">
					<PFP user={h} size={72} />
				</div>

				<span class="text-neutral-800 dark:text-neutral-200">
					{h.frameLabel}
				</span>
			</button>
		</form>
	{/each}
</div>
