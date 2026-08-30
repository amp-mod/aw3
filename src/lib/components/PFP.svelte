<script lang="ts">
	import { getPfpPath } from '$lib/storage-helpers'
	import { frames } from '$lib/frames'

	let { size = 64, user, class: className = '' } = $props()

	const ALLOWED_SIZES = [16, 24, 32, 64] as const
	type AllowedSize = (typeof ALLOWED_SIZES)[number] | 'full'

	const getEffectiveSize = (inputSize: number): AllowedSize => {
		if (inputSize >= 72) return 'full'
		return ALLOWED_SIZES.find((s) => s >= inputSize) ?? 'full'
	}

	let effectiveSize = $derived(getEffectiveSize(size))
	let avatarSrc = $derived(getPfpPath(user)[effectiveSize])

	let activeFrameKey = $derived(user.frame && frames[user.frame] ? user.frame : null)
	let activeFrameSrc = $derived(activeFrameKey ? frames[activeFrameKey] : null)
</script>

{#if activeFrameSrc}
	<div
		class="relative inline-block {className}"
		style="width: {typeof size === 'number' ? `${size}px` : '100%'}; height: {typeof size ===
		'number'
			? `${size}px`
			: '100%'};"
	>
		<img
			src={avatarSrc}
			alt={user.username}
			class="h-full w-full rounded-[10.15%] object-cover"
			loading="lazy"
		/>
		<img
			src={activeFrameSrc}
			alt=""
			aria-hidden="true"
			class="pointer-events-none absolute bottom-0 left-1/2 max-w-none -translate-x-1/2 translate-y-[2%] origin-bottom"
			style="width: 104.06%; height: auto;"
		/>
	</div>
{:else}
	<img
		src={avatarSrc}
		alt={user.username}
		class="rounded-[10.15%] border border-black/20 object-cover dark:border-white/20 {className}"
		loading="lazy"
		style="width: {typeof size === 'number' ? `${size}px` : '100%'}; height: {typeof size ===
		'number'
			? `${size}px`
			: '100%'};"
	/>
{/if}
