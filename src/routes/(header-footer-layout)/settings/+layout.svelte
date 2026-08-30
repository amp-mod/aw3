<script lang="ts">
	import {
		ExternalLink,
		SquareUserRound,
		Puzzle,
		Paintbrush,
		SquareAsterisk,
		IdCard,
		LogIn,
		Cat,
		Mail,
		Camera,
		ScanSquare,
		Share,
		Share2,
	} from '@lucide/svelte'
	import { page } from '$app/state'
	import LoginModal from '$lib/components/LoginModal.svelte'
	import { m } from '$lib/paraglide/messages.js'

	const { data, children } = $props()

	interface Tab {
		label: string
		id?: string
		href?: string
		externalIcon?: boolean
		restricted?: boolean
		icon?: any
	}

	const tabs: Tab[] = [
		{ label: 'Account', restricted: true },
		{
			id: 'profile',
			label: 'My profile',
			href: '/settings/profile',
			restricted: true,
			icon: IdCard,
		},
		/* Coming soon! {
			id: 'invite',
			label: 'Invite users',
			href: '/settings/invite',
			restricted: true,
			icon: Mail,
		},*/
		{
			id: 'link-scratch',
			label: 'Scratch account',
			href: '/settings/link-scratch',
			restricted: true,
			icon: Cat,
		},
		{
			id: 'invite',
			label: 'Invite users',
			href: '/settings/invite',
			restricted: true,
			icon: Share2,
		},
		{
			id: 'frames',
			label: 'Frames',
			href: '/settings/frames',
			restricted: true,
			icon: ScanSquare,
		},
		{
			id: 'auth',
			label: 'Passwords and 2FA',
			href: '/settings/auth',
			restricted: true,
			icon: SquareAsterisk,
		},
		{
			id: 'sessions',
			label: 'Manage sessions',
			href: '/settings/session',
			restricted: true,
			icon: LogIn,
		},
		{ label: 'AmpMod editor' },
		{ id: 'theme', label: 'Theme', href: '/settings/theme', icon: Paintbrush },
		{
			id: 'addons',
			label: 'Addons',
			href: '/settings/addons',
			externalIcon: true,
			icon: Puzzle,
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

<div class="mx-auto my-12 mb-24 flex min-h-120 max-w-5xl gap-3 overflow-hidden">
	<nav class="flex w-64 flex-col gap-1">
		<h1 class="mb-4 text-2xl font-bold text-black dark:text-white">{m.settings()}</h1>

		{#each tabs as tab}
			{#if !tab.id && (data.user || !tab.restricted)}
				<div
					class="flex w-full items-center border-b border-neutral-500/30 pt-3 pb-1 text-sm font-bold opacity-80"
				>
					{tab.label}
				</div>
			{:else if data.user || !tab.restricted}
				<a
					id={tab.id}
					class="group flex items-center justify-between rounded-md border-l-3 border-transparent px-3 py-2 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5
               {page.url.pathname === tab.href
						? 'border-accent bg-black/10 font-semibold dark:border-accent-light dark:bg-white/10'
						: ''}"
					href={tab.href}
					target={tab.externalIcon ? '_blank' : undefined}
					aria-current={page.url.pathname === tab.href ? 'page' : undefined}
				>
					<div class="flex items-center gap-3">
						{#if tab.icon}
							<tab.icon size={18} strokeWidth={page.url.pathname === tab.href ? 2.5 : 2} />
						{/if}
						<span>{tab.label}</span>
					</div>

					{#if tab.externalIcon}
						<ExternalLink size={18} />
					{/if}
				</a>
			{/if}
		{/each}
	</nav>

	<div class="border-r border-r-neutral-500/10"></div>

	{#if data.user || !isRestrictedPath}
		<div class="flex-1 px-4">
			{@render children()}
		</div>
	{/if}
</div>
