<script lang="ts">
	import { NavigationMenu, Tooltip } from 'bits-ui'
	import logo from '$lib/assets/logo.svg'
	import { modals } from '$lib/modals.svelte'
	import {
		MenuIcon,
		X,
		Search,
		ChevronDown,
		Mail,
		FolderClosed,
		Settings,
		ChevronLeft,
		Wrench,
		Shield,
	} from '@lucide/svelte'
	import { m } from '$lib/paraglide/messages'
	import { invalidateAll } from '$app/navigation'
	import PFP from '$lib/components/PFP.svelte'

	let { admin = false, data } = $props()
	let menuOpen = $state(false)

	async function logout() {
		try {
			const res = await fetch('/auth/logout', { method: 'POST' })
			if (res.ok) invalidateAll()
		} catch (err) {
			console.error(err)
		}
	}
</script>

<a
	href="#main"
	class="sr-only z-50 font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-accent-tertiary focus:px-2 focus:text-white"
>
	Skip to main content
</a>

<header
	class="flex h-14 w-full items-center border-b border-black/10 bg-white px-4 font-sans text-sm text-black md:px-6 dark:bg-accent dark:text-white shrink-0"
>
	<div class="m-auto flex w-full items-center justify-between">
		<div class="flex items-center gap-1">
			{#if !admin}
				<a href="/" aria-label="AmpMod homepage" class="header-link">
					<img src={logo} alt="AmpMod" class="h-8" />
				</a>
			{/if}

			<nav class="hidden items-center md:flex">
				{#if admin}
					<a href="/" class="header-link"><ChevronLeft /></a>
					<a href="/admin" class="header-link text-xl">Admin Panel</a>
				{:else}
					<a href="/projects/editor" data-sveltekit-reload class="header-link"
						>{m.createProject()}</a
					>
					<a href="/explore/projects" class="header-link">{m.explore()}</a>
					<a href="/about" class="header-link">{m.aboutHeader()}</a>
				{/if}
			</nav>
		</div>

		<div class="flex items-center gap-2">
			<button
				class="block p-2 text-xl focus:outline-none md:hidden"
				onclick={() => (menuOpen = !menuOpen)}
				aria-label="Toggle navigation"
			>
				{#if menuOpen}
					<X class="h-5 w-5" />
				{:else}
					<MenuIcon class="h-5 w-5" />
				{/if}
			</button>

			<form
				role="search"
				aria-label={m.searchAriaLabel()}
				class="relative hidden items-center md:flex"
				action="/search"
			>
				<input
					type="search"
					placeholder={m.searchPlaceholder()}
					class="h-10 w-full rounded-full border border-neutral-300 bg-transparent px-3 pr-12 text-sm outline-none focus:border-accent-secondary sm:w-44 md:w-64 dark:border-white/20 dark:focus:border-white"
					name="q"
				/>
				<button
					type="submit"
					class="absolute top-1/2 right-1 flex -translate-y-1/2 items-center justify-center rounded-full bg-accent-secondary px-2.5 h-8 text-white hover:bg-accent-tertiary dark:bg-white/10 dark:hover:bg-white/20"
				>
					<Search class="h-4 w-4" />
				</button>
			</form>

			{#if data.user}
				<NavigationMenu.Root class="relative z-10">
					<NavigationMenu.List class="flex items-center gap-2">
						<Tooltip.Provider delayDuration={650} disableHoverableContent>
							{#if data.user.rank >= 2}
								<NavigationMenu.Item class="hidden md:block" aria-label={m.moderation()}>
									<Tooltip.Root>
										<Tooltip.Trigger>
											<NavigationMenu.Link href="/moderate">
												{#snippet child({ props })}
													<a {...props} class="header-link"><Shield class="h-5 w-5" /></a>
												{/snippet}
											</NavigationMenu.Link>
										</Tooltip.Trigger>
										<Tooltip.Content
											sideOffset={8}
											class="z-50 rounded-lg border border-accent-secondary bg-accent px-4 py-1.5 text-sm font-bold text-white"
										>
											{m.moderation()}
											<Tooltip.Arrow class="text-accent-secondary" />
										</Tooltip.Content>
									</Tooltip.Root>
								</NavigationMenu.Item>
							{/if}
							<NavigationMenu.Item class="hidden md:block" aria-label={m.messages()}>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<NavigationMenu.Link href="/messages">
											{#snippet child({ props })}
												<a {...props} class="header-link relative">
													<Mail class="h-5 w-5" />

													{#if data.unreadNotificationsCount > 0}
														<span
															class="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-accent"
														>
															{data.unreadNotificationsCount > 99
																? '99+'
																: data.unreadNotificationsCount}
														</span>
													{/if}
												</a>
											{/snippet}
										</NavigationMenu.Link>
									</Tooltip.Trigger>
									<Tooltip.Content
										sideOffset={8}
										class="z-50 rounded-lg border border-accent-secondary bg-accent px-4 py-1.5 text-sm font-bold text-white"
									>
										{m.messages()}
										<Tooltip.Arrow class="text-accent-secondary" />
									</Tooltip.Content>
								</Tooltip.Root>
							</NavigationMenu.Item>

							<NavigationMenu.Item class="hidden md:block" aria-label={m.myStuff()}>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<NavigationMenu.Link href="/mystuff">
											{#snippet child({ props })}
												<a {...props} class="header-link"><FolderClosed class="h-5 w-5" /></a>
											{/snippet}
										</NavigationMenu.Link>
									</Tooltip.Trigger>
									<Tooltip.Content
										sideOffset={8}
										class="z-50 rounded-lg border border-accent-secondary bg-accent px-4 py-1.5 text-sm font-bold text-white"
									>
										{m.myStuff()}
										<Tooltip.Arrow class="text-accent-secondary" />
									</Tooltip.Content>
								</Tooltip.Root>
							</NavigationMenu.Item>
						</Tooltip.Provider>

						<NavigationMenu.Item value="profile" openOnHover={false}>
							<NavigationMenu.Trigger>
								{#snippet child({ props })}
									<button {...props} class="header-link relative flex items-center">
										<PFP user={data.user} size={28} />
										{#if data.canRankUp}
											<span
												class=" flex items-center justify-center text-xs text-white absolute bottom-0 right-1 bg-red-500 border border-red-700 w-3 h-3 rounded-full"
												>!</span
											>
										{/if}
									</button>
								{/snippet}
							</NavigationMenu.Trigger>

							<NavigationMenu.Content
								class="absolute top-full right-0 z-9999 mt-4 min-w-48 overflow-hidden rounded-md border border-neutral-300 bg-white dark:border-white/20 dark:bg-accent shadow-xl"
							>
								<ul class="flex flex-col p-1">
									<li>
										<NavigationMenu.Link href={`/users/${data.user.username}`}>
											{#snippet child({ props })}<a {...props} class="submenu-item">
													<div class="flex gap-2 items-center">
														<PFP size={32} user={data.user} />
														<div class="flex flex-col gap-1">
															<span class="text-lg font-bold">{data.user.username}</span>
														</div>
													</div>

													{#if data.canRankUp}<span
															class="bg-red-500 border border-red-700 w-3 h-3 rounded-full inline-block"
														></span>{/if}</a
												>{/snippet}
										</NavigationMenu.Link>
									</li>
									<li>
										<NavigationMenu.Link href="/settings">
											{#snippet child({ props })}<a {...props} class="submenu-item"
													>{m.settings()}</a
												>{/snippet}
										</NavigationMenu.Link>
									</li>
									{#if data.user.rank >= 3}
										<li>
											<NavigationMenu.Link href="/admin">
												{#snippet child({ props })}<a {...props} class="submenu-item"
														>{m.adminPanel()}</a
													>{/snippet}
											</NavigationMenu.Link>
										</li>
									{/if}
									<li>
										<button onclick={logout} class="submenu-item w-full text-left"
											>{m.logOut()}</button
										>
									</li>
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
					</NavigationMenu.List>
				</NavigationMenu.Root>
			{:else}
				<div class="hidden items-center gap-1 md:flex">
					<NavigationMenu.Root>
						<NavigationMenu.List class="flex items-center gap-1">
							<NavigationMenu.Item>
								<Tooltip.Provider delayDuration={650} disableHoverableContent>
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<a {...props} href="/settings" class="header-link">
													<Settings size={18} />
												</a>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content
											sideOffset={8}
											class="z-50 rounded-lg border border-accent-secondary bg-accent px-4 py-1.5 text-sm font-bold text-white"
										>
											{m.settings()}
											<Tooltip.Arrow class="text-accent-secondary" />
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>
							</NavigationMenu.Item>

							<NavigationMenu.Item>
								{#snippet child({ props })}
									<button {...props} onclick={() => (modals.login = true)} class="header-link">
										{m.logIn()}
									</button>
								{/snippet}
							</NavigationMenu.Item>

							<NavigationMenu.Item>
								{#snippet child({ props })}
									<a
										{...props}
										href="/auth/register"
										class="h-10 rounded-full px-5 font-bold flex items-center justify-center text-white bg-gradient-to-r from-accent to-accent-secondary hover:opacity-90 transition-opacity dark:from-white dark:to-neutral-100 dark:text-accent dark:hover:bg-neutral-200 text-xl shadow-tiny"
									>
										{m.joinAmpMod()}
									</a>
								{/snippet}
							</NavigationMenu.Item>
						</NavigationMenu.List>
					</NavigationMenu.Root>
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	@reference '../../app.css';

	.header-link {
		@apply flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-full px-3 font-bold whitespace-nowrap transition-colors outline-none;
		@apply hover:bg-black/5 focus-visible:bg-black/5;
		@apply data-[state=open]:bg-accent-light/20 dark:data-[state=open]:bg-black/20;
		@apply not-dark:data-[state=open]:text-accent-secondary;
	}

	.submenu-item {
		@apply flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1.5 font-medium outline-none;
		@apply transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 data-[highlighted]:bg-neutral-100;
		@apply dark:hover:bg-white/10 dark:focus-visible:bg-white/10 dark:data-[highlighted]:bg-white/10;
	}
</style>
