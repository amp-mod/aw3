<script lang="ts">
	import { DropdownMenu, Tabs } from 'bits-ui'
	import {
		ExternalLink,
		Globe,
		Clapperboard,
		File,
		ChevronDown,
		Plus,
		SquareStack,
		Cat,
		GlobeOff,
		Folder,
		ChevronRight,
		Flag,
	} from '@lucide/svelte'
	import { myStuffState } from './mystuff.svelte'
	import LoginModal from '$lib/components/LoginModal.svelte'
	import { m } from '$lib/paraglide/messages.js'
	import MyStuffProjectList from './MyStuffProjectList.svelte'
	import ComingSoon from '$lib/components/ComingSoon.svelte'
	import { onMount } from 'svelte'

	const { data } = $props()

	const styles = {
		tab: 'rounded-l-xl border-r-0 cursor-pointer border border-neutral-300 bg-neutral-100 px-5 text-neutral-600 outline-none flex items-center gap-3 data-[state=active]:bg-white data-[state=active]:text-accent-secondary h-10 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-300 dark:data-[state=active]:bg-neutral-700 dark:data-[state=active]:text-white transition-all',
		subtab:
			'rounded-l-xl border-r-0 cursor-pointer border border-neutral-300 bg-neutral-100 pl-9 pr-5 text-neutral-600 outline-none flex items-center gap-3 data-[state=active]:bg-white data-[state=active]:text-accent-secondary h-10 dark:border-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-300 dark:data-[state=active]:bg-neutral-700 dark:data-[state=active]:text-white transition-all',
	}

	const projectActions = [
		{ label: 'Open editor', href: '/projects/editor', icon: Clapperboard, external: true },
		{ label: 'Import .apz or .sb3 file', href: '/upload', icon: File },
		{ label: 'Import from Scratch', href: '/settings/link-scratch', icon: Cat },
	]

	const galleryActions = [{ label: 'New gallery', href: '/galleries/new', icon: SquareStack }]

	const validViews = ['all', 'shared', 'unshared', 'galleries']

	// Load initial view state from location hash on mount
	onMount(() => {
		const hash = window.location.hash.replace('#', '')
		if (validViews.includes(hash)) {
			myStuffState.view = hash as typeof myStuffState.view
		}

		const handleHashChange = () => {
			const currentHash = window.location.hash.replace('#', '')
			if (validViews.includes(currentHash)) {
				myStuffState.view = currentHash as typeof myStuffState.view
			}
		}

		window.addEventListener('hashchange', handleHashChange)
		return () => window.removeEventListener('hashchange', handleHashChange)
	})

	// Sync current view state to URL hash
	$effect(() => {
		const currentView = myStuffState.view
		if (typeof window === 'undefined') return

		if (currentView === 'all') {
			if (window.location.hash) {
				history.replaceState(null, '', window.location.pathname + window.location.search)
			}
		} else {
			if (window.location.hash !== `#${currentView}`) {
				window.location.hash = currentView
			}
		}
	})

	// Parent Projects section expands if "projects" or any subtab is active
	const isProjectsSectionActive = $derived(
		myStuffState.view === 'all' ||
			myStuffState.view === 'shared' ||
			myStuffState.view === 'unshared',
	)

	// Filter actions dynamically depending on the selected tab
	const newActions = $derived(myStuffState.view === 'galleries' ? galleryActions : projectActions)

	// Single action item target if only one exists
	const singleAction = $derived(newActions.length === 1 ? newActions[0] : null)
</script>

{#if !data.user}
	<LoginModal open={true} required />
{/if}

<svelte:head>
	<title>My Stuff - AmpMod</title>
</svelte:head>

<div class="mx-auto my-12 mb-24 flex max-w-6xl flex-col gap-8 px-4">
	<header class="flex flex-col gap-8">
		<div class="flex items-center justify-between">
			<h1 class="text-3xl font-bold">{m.myStuff()}</h1>

			<div class="flex items-center gap-4">
				<div class="relative w-64">
					<input
						type="search"
						bind:value={myStuffState.searchTerm}
						placeholder="Search your stuff..."
						class="input"
					/>
				</div>

				{#if singleAction}
					<!-- Single Action: Render directly as a link -->
					<a
						href={singleAction.href}
						target={singleAction.external ? '_blank' : undefined}
						class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
					>
						<Plus size={16} />
						<span>{singleAction.label}</span>
						{#if singleAction.external}
							<ExternalLink size={14} class="opacity-70" />
						{/if}
					</a>
				{:else}
					<!-- Multiple Actions: Render Dropdown Menu -->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
						>
							<Plus size={16} />
							<span>New project</span>
							<ChevronDown size={16} />
						</DropdownMenu.Trigger>

						<DropdownMenu.Content
							class="z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-neutral-500/20 bg-white p-1 outline-none dark:bg-neutral-900"
							align="end"
							sideOffset={5}
						>
							{#each newActions as action}
								<DropdownMenu.Item
									class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none select-none hover:bg-black/5 focus:bg-black/5 dark:hover:bg-white/5 dark:focus:bg-white/5"
								>
									<a
										href={action.href}
										target={action.external ? '_blank' : undefined}
										class="flex w-full items-center gap-3"
									>
										<action.icon size={18} class="text-neutral-500" />
										<span class="flex-1">{action.label}</span>
										{#if action.external}
											<ExternalLink size={14} class="opacity-40" />
										{/if}
									</a>
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
			</div>
		</div>
	</header>

	<Tabs.Root
		bind:value={myStuffState.view}
		class="flex min-h-120 items-stretch"
		orientation="vertical"
	>
		<Tabs.List class="flex w-64 flex-col gap-2 py-8">
			<Tabs.Trigger value="all" class="{styles.tab} justify-between">
				<div class="flex items-center gap-3">
					<Flag size={18} />
					<span>My projects</span>
				</div>
			</Tabs.Trigger>

			<div class="flex flex-col gap-1.5 pl-6">
				<Tabs.Trigger value="shared" class={styles.subtab}>
					<span class="text-sm">Shared Projects</span>
				</Tabs.Trigger>

				<Tabs.Trigger value="unshared" class={styles.subtab}>
					<span class="text-sm">Unshared Projects</span>
				</Tabs.Trigger>
			</div>

			<Tabs.Trigger value="galleries" class={styles.tab}>
				<SquareStack size={18} />
				<span>My galleries</span>
			</Tabs.Trigger>
		</Tabs.List>

		{#if data.user}
			<main
				class="flex-1 rounded-lg border border-neutral-300 bg-white p-6 dark:border-neutral-500 dark:bg-neutral-800"
			>
				<!-- Active Content for "All Projects" -->
				<Tabs.Content value="all">
					{#if myStuffState.view === 'all'}
						<MyStuffProjectList type="all" />
					{/if}
				</Tabs.Content>

				<Tabs.Content value="shared">
					{#if myStuffState.view === 'shared'}
						<MyStuffProjectList type="shared" />
					{/if}
				</Tabs.Content>

				<Tabs.Content value="unshared">
					{#if myStuffState.view === 'unshared'}
						<MyStuffProjectList type="unshared" />
					{/if}
				</Tabs.Content>

				<Tabs.Content value="galleries">
					<ComingSoon />
				</Tabs.Content>
			</main>
		{/if}
	</Tabs.Root>
</div>
