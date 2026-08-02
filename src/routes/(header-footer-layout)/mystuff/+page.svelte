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
	} from '@lucide/svelte'
	import { myStuffState } from './mystuff.svelte'
	import LoginModal from '$lib/components/LoginModal.svelte'
	import { m } from '$lib/paraglide/messages.js'
	import MyStuffProjectList from './MyStuffProjectList.svelte'

	const { data } = $props()

	const styles = {
		tab: 'rounded-l-xl border-r-0 cursor-pointer border border-neutral-300 bg-neutral-100 p-5 text-neutral-600 outline-none  flex items-center gap-3 data-[state=active]:bg-white data-[state=active]:text-accent-secondary h-10 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-300 dark:data-[state=active]:bg-neutral-700 dark:data-[state=active]:text-white',
	}

	const tabs = [
		{ id: 'shared', label: 'Shared Projects', icon: Globe },
		{ id: 'unshared', label: 'Unshared Projects', icon: GlobeOff },
		{ id: 'galleries', label: 'My galleries', icon: SquareStack },
	]

	const newActions = [
		{ label: 'Project Editor', href: '/projects/editor', icon: Clapperboard, external: true },
		{ label: 'Import .apz or .sb3 file', href: '/upload', icon: File },
		{ label: 'Import from Scratch', href: '/settings/link-scratch', icon: Cat },
		{ label: 'New gallery', href: '/galleries/new', icon: SquareStack },
	]
</script>

{#if !data.user}
	<LoginModal open={true} required />
{/if}

<svelte:head>
	<title>My Stuff - AmpMod</title>
</svelte:head>

<div class="mx-auto my-12 mb-24 flex max-w-5xl flex-col gap-8 px-4 text-black dark:text-white">
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

				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-secondary focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none"
					>
						<Plus size={18} />
						<span>Create</span>
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
			</div>
		</div>
	</header>
	<Tabs.Root
		bind:value={myStuffState.view}
		class="flex min-h-120 items-stretch"
		orientation="vertical"
	>
		<Tabs.List class="flex w-64 flex-col gap-2 py-8">
			{#each tabs as tab}
				{@const isActive = myStuffState.view === tab.id}
				<Tabs.Trigger value={tab.id} class={styles.tab}>
					{#if tab.icon}
						<tab.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
					{/if}
					<span>{tab.label}</span>
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		{#if data.user}
			<main
				class=" flex-1 rounded-lg border border-neutral-300 bg-white p-6 dark:border-neutral-500 dark:bg-neutral-800"
			>
				<Tabs.Content value="shared">
					<MyStuffProjectList type="shared" />
				</Tabs.Content>

				<Tabs.Content value="unshared">
					<MyStuffProjectList type="unshared" />
				</Tabs.Content>

				<Tabs.Content value="galleries">
					<div class="py-20 text-center text-neutral-500 italic">
						All your gallery are belong to us
					</div>
				</Tabs.Content>

				<Tabs.Content value="curating">
					<div class="py-20 text-center text-neutral-500">Coming soon</div>
				</Tabs.Content>
			</main>
		{/if}
	</Tabs.Root>
</div>
