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
		TriangleAlert,
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
			id: 'appearance',
			label: 'Appearance',
			href: '/settings/appearance',
			restricted: true,
			icon: Paintbrush,
		},
		{
			id: 'email',
			label: 'Email',
			href: '/settings/email',
			restricted: true,
			icon: Mail,
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
		{
			id: 'danger',
			label: 'Delete account',
			href: '/settings/danger',
			restricted: true,
			icon: TriangleAlert,
		},
		{ label: 'AmpMod editor', restricted: true },
		{ id: 'theme', label: 'Editor theme', href: '/settings/theme', icon: Paintbrush },
		{
			id: 'addons',
			label: 'Addons',
			href: '/settings/addons',
			externalIcon: true,
			icon: Puzzle,
		},
	]

	const styles = {
		tab: 'rounded-l-xl border-r-0 cursor-pointer border border-neutral-300 bg-neutral-100 px-5 text-neutral-600 outline-none flex items-center gap-3 h-10 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-300 transition-all text-sm font-normal',
		activeTab: 'bg-white text-accent-secondary dark:bg-neutral-700 dark:text-white font-medium',
		header: 'pt-3 pb-1 px-2 text-xs font-bold text-neutral-500 dark:text-neutral-400',
	}

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

<div class="bg-accent-secondary p-8 text-center text-white">
	<h1 class="text-3xl font-bold">{m.settings()}</h1>
</div>

<div class="mx-auto my-12 mb-24 flex max-w-6xl flex-col gap-8 px-4">
	<div class="flex min-h-120 items-stretch">
		<nav class="flex w-64 flex-col gap-2 py-3">
			{#each tabs as tab}
				{#if !tab.id && (data.user || !tab.restricted)}
					<div class={styles.header}>
						{tab.label}
					</div>
				{:else if data.user || !tab.restricted}
					<a
						id={tab.id}
						href={tab.href}
						target={tab.externalIcon ? '_blank' : undefined}
						aria-current={page.url.pathname === tab.href ? 'page' : undefined}
						class="{styles.tab} justify-between {page.url.pathname === tab.href
							? styles.activeTab
							: ''}"
					>
						<div class="flex items-center gap-3">
							{#if tab.icon}
								<tab.icon size={18} />
							{/if}
							<span>{tab.label}</span>
						</div>

						{#if tab.externalIcon}
							<ExternalLink size={14} class="opacity-70" />
						{/if}
					</a>
				{/if}
			{/each}
		</nav>

		{#if data.user || !isRestrictedPath}
			<main
				class="flex-1 rounded-lg border border-neutral-300 bg-white p-6 dark:border-neutral-500 dark:bg-neutral-800"
			>
				{@render children()}
			</main>
		{/if}
	</div>
</div>
