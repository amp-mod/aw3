<script lang="ts">
	import {
		ExternalLink,
		Lock,
		Globe,
		Cat,
		SquareStack,
		Paintbrush,
		UserRound,
		Plus,
		CopyPlus,
		UsersRound,
		UserRoundCog,
		Clapperboard,
		File,
	} from '@lucide/svelte'
	import { page } from '$app/state'
	import LoginModal from '$lib/components/LoginModal.svelte'
	import { m } from '$lib/paraglide/messages.js'
	import ScratchLogo from '~icons/simple-icons/scratch'

	const { data, children } = $props()

	interface Tab {
		label: string
		id?: string
		href?: string
		icon?: any
		isButton?: boolean
		externalLink?: boolean
	}

	const tabs: Tab[] = [
		{
			id: 'new-project',
			label: 'Project editor',
			href: '/projects/editor',
			icon: Clapperboard,
			isButton: true,
			externalLink: true,
		},
		{
			id: 'new-gallery',
			label: 'New gallery',
			href: '/galleries/new',
			icon: SquareStack,
			isButton: true,
		},
		{
			id: 'file',
			label: 'Import file',
			href: '/upload',
			icon: File,
			isButton: true,
		},
		{
			id: 'scratch',
			label: 'Import from Scratch',
			href: '/settings/link-scratch',
			icon: Cat,
			isButton: true,
		},
		{ label: 'Projects' },
		{ id: 'shared', label: 'Shared', href: '/mystuff', icon: Globe },
		{ id: 'unshared', label: 'Unshared', href: '/mystuff/unshared', icon: Lock },
		// { id: 'collabs', label: 'Collabs', href: '/mystuff/collabs', icon: UsersRound },
		{ label: 'Galleries' },
		{ id: 'galleries', label: 'As manager', href: '/mystuff/galleries', icon: UserRoundCog },
		{
			id: 'galleries-curating',
			label: 'As curator',
			href: '/mystuff/galleries/curating',
			icon: Paintbrush,
		},
	]

	const activeTab = $derived(tabs.find((t) => t.href === page.url.pathname))
	const activeTabLabel = $derived(activeTab?.label ?? 'Settings')
</script>

{#if !data.user}
	<LoginModal open={true} required />
{/if}

<svelte:head>
	<title>My Stuff: {activeTabLabel} - AmpMod</title>
</svelte:head>

<div class="mx-auto my-12 mb-24 flex min-h-120 max-w-5xl gap-3 overflow-hidden">
	<nav class="flex w-64 flex-col gap-1">
		<h1 class="mb-4 text-2xl font-bold text-black dark:text-white">{m.myStuff()}</h1>

		{#each tabs as tab}
			{#if !tab.id}
				<div
					class="flex w-full items-center border-b border-neutral-500/30 pt-3 pb-1 text-sm font-bold opacity-80"
				>
					{tab.label}
				</div>
			{:else}
				<a
					id={tab.id}
					class="group flex items-center justify-between rounded-md border-l-3 border-transparent px-3 py-2 text-sm
               {page.url.pathname === tab.href
						? 'border-accent bg-black/10 font-semibold dark:border-accent-light dark:bg-white/10'
						: ''}
                        {tab.isButton
						? 'bg-accent text-white hover:bg-accent-secondary'
						: 'text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5'}"
					href={tab.href}
					target={tab.externalLink ? '_blank' : undefined}
					aria-current={page.url.pathname === tab.href ? 'page' : undefined}
				>
					<div class="flex items-center gap-3">
						{#if tab.icon}
							<tab.icon size={18} strokeWidth={page.url.pathname === tab.href ? 2.5 : 2} />
						{/if}
						<span>{tab.label}</span>
					</div>

					{#if tab.externalLink}
						<ExternalLink size={18} />
					{/if}
				</a>
			{/if}
		{/each}
	</nav>

	<div class="border-r border-r-neutral-500/10"></div>

	{#if data.user}
		<div class="flex-1 px-4">
			{@render children()}
		</div>
	{/if}
</div>
