<script lang="ts">
	import { ExternalLink } from '@lucide/svelte'
	import { page } from '$app/state'
	import LoginModal from '$lib/components/LoginModal.svelte'

	const { data, children } = $props()

	interface Tab {
		label: string
		id?: string
		href?: string
		externalIcon?: boolean
		restricted?: boolean
	}

	const tabs: Tab[] = [
		{ label: 'Account', restricted: true },
		{ id: 'profile', label: 'Profile', href: '/settings/profile', restricted: true },
		{ id: 'sessions', label: 'Sessions', href: '/settings/session', restricted: true },
		{ id: 'danger', label: 'Dangerous', href: '/settings/danger', restricted: true },
		{ label: 'Editor' },
		{ id: 'theme', label: 'Theme', href: '/settings/theme' },
		{
			id: 'addons',
			label: 'Addons',
			href: '/settings/addons',
			externalIcon: true,
		},
	]

	const activeTab = $derived(tabs.find((t) => t.href === page.url.pathname))

	const activeTabLabel = $derived(activeTab?.label ?? 'Settings')
	const isRestrictedPath = $derived(!!activeTab?.restricted)
</script>

{#if isRestrictedPath && !data.user}
	<LoginModal open={true} required />
{/if}

<svelte:head>
	<title>Settings: {activeTabLabel} - AmpMod</title>
</svelte:head>

<h1 class="mx-auto mt-8 mb-4 max-w-5xl text-3xl font-bold text-black dark:text-white">Settings</h1>

<div
	class="mx-auto mb-24 flex min-h-120 max-w-5xl overflow-hidden rounded-xl border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-800"
>
	<nav class="flex w-64 flex-col gap-2 bg-neutral-200 p-4 dark:bg-accent-secondary">
		{#each tabs as tab}
			{#if !tab.id && (data.user || !tab.restricted)}
				<div class="flex w-full items-center gap-3 py-2">
					<div class="text-sm font-bold">
						{tab.label}
					</div>
					<div class="flex-1 border-t border-neutral-500/30 dark:border-accent-tertiary"></div>
				</div>
			{:else if data.user || !tab.restricted}
				<a
					id={tab.id}
					class="rounded px-3 py-2 text-left text-black transition-colors hover:bg-black/10 dark:text-white dark:hover:bg-accent-tertiary
               {page.url.pathname === tab.href
						? 'bg-black/10 font-semibold dark:bg-accent-tertiary'
						: ''}"
					href={tab.href}
					target={tab.externalIcon ? '_blank' : undefined}
					aria-current={page.url.pathname === tab.href ? 'page' : undefined}
				>
					<div class="flex items-center justify-between">
						<div class="inline-flex items-center gap-2">
							{tab.label}
						</div>
						{#if tab.externalIcon}
							<ExternalLink size={18} class="text-black dark:text-white" />
						{/if}
					</div>
				</a>
			{/if}
		{/each}
	</nav>

	{#if data.user || !isRestrictedPath}
		<div class="flex-1 p-6 text-black dark:text-white">
			{@render children()}
		</div>
	{/if}
</div>
