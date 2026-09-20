<script lang="ts">
	import { enhance } from '$app/forms'
	import Button from '$lib/components/Button.svelte'
	import PFP from '$lib/components/PFP.svelte'
	import { frames } from '$lib/frames'

	let { data, form } = $props()
	let colourFormElement = $state<HTMLFormElement>()

	const DEFAULT_COLOUR = '#4fa55c'

	let accentColour = $state(data.user.accentColour ?? DEFAULT_COLOUR)
	let selectedFrame = $state(data.user.frame ?? '')
	let isColourPending = $state(false)
	let pendingFrame = $state<string | null>(null)

	// Debounce timer reference
	let colourSubmitTimeout = $state<ReturnType<typeof setTimeout> | null>(null)

	$effect(() => {
		accentColour = data.user.accentColour ?? DEFAULT_COLOUR
		selectedFrame = data.user.frame ?? ''
	})

	const frameOptions = $derived([
		{
			...data.user,
			frame: '',
			frameLabel: 'None',
		},
		...Object.keys(frames).map((f) => ({
			...data.user,
			frame: f,
			frameLabel: frames[f].name,
		})),
	])

	const handleColourEnhance = () => {
		isColourPending = true
		return async ({
			result,
			update,
		}: {
			result: { type: string }
			update: () => Promise<void>
		}) => {
			if (result.type === 'failure' || result.type === 'error') {
				accentColour = data.user.accentColour ?? DEFAULT_COLOUR
			}
			await update()
			isColourPending = false
		}
	}

	// Debounces the submit call by the specified delay (default 400ms)
	const debouncedSubmitColour = (delay = 400) => {
		if (colourSubmitTimeout) clearTimeout(colourSubmitTimeout)
		colourSubmitTimeout = setTimeout(() => {
			colourFormElement?.requestSubmit()
		}, delay)
	}

	const handleResetColour = () => {
		if (accentColour === DEFAULT_COLOUR) return
		if (colourSubmitTimeout) clearTimeout(colourSubmitTimeout)
		accentColour = DEFAULT_COLOUR
		setTimeout(() => colourFormElement?.requestSubmit(), 0)
	}

	const handleFrameEnhance = (frameValue: string) => {
		pendingFrame = frameValue
		const previousFrame = selectedFrame
		selectedFrame = frameValue // Optimistic update

		return async ({
			result,
			update,
		}: {
			result: { type: string }
			update: () => Promise<void>
		}) => {
			if (result.type === 'failure' || result.type === 'error') {
				selectedFrame = previousFrame
			}
			await update()
			pendingFrame = null
		}
	}
</script>

<h2 class="mb-2 text-3xl font-bold">Appearance</h2>

<div class="flex flex-col gap-8">
	<!-- Accent Colour Section -->
	<form
		method="POST"
		action="?/updateAppearance"
		use:enhance={handleColourEnhance}
		bind:this={colourFormElement}
		class="flex flex-col gap-4 {isColourPending ? 'opacity-70' : ''}"
	>
		{#if form?.error}
			<p class="text-sm font-medium text-red-500">{form.error}</p>
		{/if}

		<div class="flex flex-col gap-1.5">
			<h3 class="text-2xl font-semibold">Accent</h3>

			<div class="mt-1 flex items-center gap-3">
				<input
					id="accentColour"
					name="accentColour"
					type="color"
					bind:value={accentColour}
					disabled={isColourPending}
					oninput={() => debouncedSubmitColour(400)}
					class="h-10 w-12 cursor-pointer rounded border border-black/10 bg-transparent p-1 disabled:cursor-not-allowed"
				/>
				<span class="font-mono text-sm uppercase text-neutral-600 dark:text-neutral-400">
					{accentColour}
				</span>
				{#if accentColour !== DEFAULT_COLOUR}
					<Button type="button" onclick={handleResetColour} disabled={isColourPending}>
						Reset default
					</Button>
				{/if}
			</div>
		</div>
	</form>

	<section class="flex flex-col gap-2">
		<h3 class="text-2xl font-semibold">Frames</h3>
		<p>Add a cool frame to your profile picture!</p>
		<p>
			If you want to stand out more, you can pick the main colour of a frame and make it the
			background for your profile picture.
		</p>
		<p>
			Frames are experimental. Available frames may change or be removed without notice, and you may
			see glitches in some places.
		</p>

		{#if data.canUseFrames}
			<div class="pb-4 grid grid-cols-4 gap-2">
				{#each frameOptions as h}
					{@const isSelected = selectedFrame === h.frame}
					{@const isThisPending = pendingFrame === h.frame}

					<form method="POST" action="?/setFrame" use:enhance={() => handleFrameEnhance(h.frame)}>
						<input type="hidden" name="frame" value={h.frame} />

						<button
							type="submit"
							class="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border transition-all focus:ring-2 focus:ring-accent focus:outline-none disabled:cursor-default {isSelected
								? 'border-accent bg-accent/10 dark:border-accent-light dark:bg-accent/20'
								: 'border-black/5 hover:border-black/20 dark:border-white/5 dark:bg-neutral-800/50 dark:hover:border-white/20'} {isThisPending
								? 'opacity-70'
								: ''}"
							disabled={isSelected || pendingFrame !== null}
						>
							<PFP user={{ ...h, frame: h.frame }} size={48} />

							<span class="text-sm text-neutral-800 dark:text-neutral-200">
								{h.frameLabel}
							</span>
						</button>
					</form>
				{/each}
			</div>
		{:else}
			<p class="mt-2 text-sm text-neutral-500">You can't use frames right now.</p>
		{/if}
	</section>
</div>
