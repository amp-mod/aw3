<script lang="ts">
	import { browser } from '$app/environment'
	import { TriangleAlert, XIcon } from '@lucide/svelte'
	import { slide } from 'svelte/transition'
	let {
		id,
		background = 'grey',
		foreground = 'white',
		children,
		button = null,
		icon = TriangleAlert,
		closable = true,
	} = $props()

	let hiddenAlerts: string[] = $state([])
	if (typeof window !== 'undefined') {
		hiddenAlerts = JSON.parse(localStorage.getItem('aw3:hiddenAlerts') || '[]')
	}

	function removeAlert(id: any) {
		if (typeof window !== 'undefined') {
			const hiddenAlerts = JSON.parse(localStorage.getItem('aw3:hiddenAlerts') || '[]')
			if (!hiddenAlerts.includes(id) && closable) {
				hiddenAlerts.push(id)
				localStorage.setItem('aw3:hiddenAlerts', JSON.stringify(hiddenAlerts))
			}
		}
		hiddenAlerts = [...hiddenAlerts, id]
	}
</script>

{#if browser && (!hiddenAlerts.includes(id) || !closable)}
	<div
		class="flex items-center justify-between bg-(--alert-bg-param) p-2 font-bold text-(--alert-fg-param) transition-all"
		style="--alert-bg-param: {background}; --alert-fg-param: {foreground};"
		out:slide={{ duration: 400 }}
	>
		<div class="flex min-h-[40px] flex-grow items-center justify-center">
			{#if icon}
				{@const Icon = icon}
				<div class="mr-2 flex items-center">
					<Icon />
				</div>
			{/if}
			<div class="block">
				{@render children()}
			</div>
			{#if button}
				<a
					href={button.url}
					class="ml-2 cursor-pointer rounded-full bg-(--alert-fg-param) px-4 py-2 text-sm font-bold text-(--alert-bg-param) no-underline"
				>
					<span class="sr-only">{@render children()} </span>{button.text}
				</a>
			{/if}
		</div>
		{#if closable}
			<button
				class="ml-auto cursor-pointer px-2 text-lg"
				style="background: none; border: none; color: var(--alert-fg-param);"
				onclick={() => removeAlert(id)}
			>
				<XIcon />
				<span class="sr-only">Close alert</span>
			</button>
		{/if}
	</div>
{/if}
