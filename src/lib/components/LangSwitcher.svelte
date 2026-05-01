<script lang="ts">
	import { Select } from 'bits-ui'
	import { locales, getLocale, setLocale } from '$lib/paraglide/runtime'
	import { ChevronDown, Globe } from '@lucide/svelte'

	type Locale = (typeof locales)[number]

	const getNativeName = (tag: string) => {
		try {
			const displayNames = new Intl.DisplayNames([tag], { type: 'language', fallback: 'code' })
			return displayNames.of(tag) ?? tag.toUpperCase()
		} catch {
			return tag.toUpperCase()
		}
	}

	function scrollIntoView(node: HTMLElement, isSelected: boolean) {
		if (isSelected) {
			requestAnimationFrame(() => {
				node.scrollIntoView({ block: 'nearest', behavior: 'instant' })
			})
		}
	}
</script>

<Select.Root type="single" value={getLocale()} onValueChange={(v) => v && setLocale(v as any)}>
	<Select.Trigger
		class="flex h-10 min-w-96 cursor-pointer items-center justify-between gap-2 rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
	>
		<div class="flex items-center gap-2">
			<Globe />
			<div>{getNativeName(getLocale())}</div>
		</div>
		<ChevronDown class="size-4 opacity-50" />
	</Select.Trigger>

	<Select.Content
		sideOffset={8}
		class="z-50 max-h-96 min-w-96 overflow-auto rounded border border-neutral-300 bg-white py-1 outline-none dark:border-neutral-700 dark:bg-neutral-800"
	>
		{#each [...locales].sort() as tag}
			{@const isSelected = getLocale() === tag}
			<Select.Item
				value={tag}
				label={getNativeName(tag)}
				use={(node: HTMLElement) => scrollIntoView(node, isSelected)}
				class="group flex cursor-pointer items-center justify-between px-3 py-2 text-sm outline-none 
                  data-highlighted:bg-accent data-highlighted:text-white"
			>
				<span class="font-medium">{getNativeName(tag)}</span>
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
