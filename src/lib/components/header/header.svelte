<script lang="ts">
	import { NavigationMenu, Tooltip } from 'bits-ui'
	import logo from './logo.svg'
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
	} from '@lucide/svelte'
	import { m } from '$lib/paraglide/messages'
	import { invalidateAll } from '$app/navigation'
	import { getPfpPath } from '$lib/storage-helpers'

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
	class="flex h-12 w-full items-center border-b border-black/10 bg-white px-4 font-sans text-sm text-black md:px-6 dark:bg-accent dark:text-white"
>
	<div class="m-auto flex w-full max-w-6xl items-center justify-between" class:max-w-full={admin}>
		<div class="flex items-center gap-1">
			{#if !admin}
				<a
					href="/"
					aria-label="AmpMod homepage"
					class="transform px-3 transition-transform hover:scale-110"
				>
					<img src={logo} alt="AmpMod" class="h-7" />
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
					<a href="/projects/explore" class="header-link">{m.explore()}</a>
					{#if !data.user}
						<a href="/about" class="header-link">{m.aboutHeader()}</a>
						<a href="https://ampmod.codeberg.page/manual" class="header-link">Manual</a>
					{/if}
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
				onsubmit={(e) => e.preventDefault()}
			>
				<input
					type="search"
					placeholder={m.searchPlaceholder()}
					class="h-8 w-full rounded-lg border border-neutral-300 bg-transparent px-3 pr-12 text-sm outline-none focus:border-accent-secondary sm:w-44 md:w-64 dark:border-white/20 dark:focus:border-white"
				/>
				<button
					type="submit"
					class="absolute top-1/2 right-1 flex -translate-y-1/2 items-center justify-center rounded bg-accent-secondary px-2.5 py-1 text-white hover:bg-accent-tertiary dark:bg-white/10 dark:hover:bg-white/20"
				>
					<Search class="h-4 w-4" />
				</button>
			</form>

			{#if data.user}
				<NavigationMenu.Root class="relative z-10">
					<NavigationMenu.List class="flex items-center gap-2">
						<Tooltip.Provider delayDuration={650} disableHoverableContent>
							<NavigationMenu.Item class="hidden md:block" aria-label={m.messages()}>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<NavigationMenu.Link href="/messages">
											{#snippet child({ props })}
												<a {...props} class="header-link"><Mail class="h-5 w-5" /></a>
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

							{#if data.user.rank === 3}
								<NavigationMenu.Item class="hidden md:block" aria-label="Admin Panel">
									<Tooltip.Root>
										<Tooltip.Trigger>
											<NavigationMenu.Link href="/admin">
												{#snippet child({ props })}
													<a {...props} class="header-link"><Wrench class="h-5 w-5" /></a>
												{/snippet}
											</NavigationMenu.Link>
										</Tooltip.Trigger>
										<Tooltip.Content
											sideOffset={8}
											class="z-50 rounded-lg border border-accent-secondary bg-accent px-4 py-1.5 text-sm font-bold text-white"
										>
											Admin Panel
											<Tooltip.Arrow class="text-accent-secondary" />
										</Tooltip.Content>
									</Tooltip.Root>
								</NavigationMenu.Item>
							{/if}
						</Tooltip.Provider>

						<NavigationMenu.Item value="profile" openOnHover={false}>
							<NavigationMenu.Trigger>
								{#snippet child({ props })}
									<button {...props} class="header-link flex items-center gap-2">
										<img
											src={getPfpPath(data.user)['24']}
											class="h-6 w-6 rounded border border-black/10 bg-white object-cover"
											alt="User icon"
										/>
										<div class="hidden max-w-30 overflow-hidden text-ellipsis sm:block">
											{data.user.username}
										</div>
										<ChevronDown
											class="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
										/>
									</button>
								{/snippet}
							</NavigationMenu.Trigger>

							<NavigationMenu.Content
								class="absolute top-full right-0 z-50 mt-2 w-38 overflow-hidden rounded-md border border-neutral-300 bg-white dark:border-white/20 dark:bg-accent"
							>
								<ul class="flex flex-col py-1">
									<li>
										<NavigationMenu.Link href={`/users/${data.user.username}`}>
											{#snippet child({ props })}<a {...props} class="submenu-item"
													>{m.myProfile()}</a
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
										class="header-link bg-accent text-white hover:bg-accent-secondary! dark:bg-white dark:text-accent hover:dark:bg-neutral-200!"
									>
										{m.join()}
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
	@reference '../../../app.css';

	.header-link {
		@apply flex h-10 cursor-pointer items-center rounded-lg px-3 font-bold whitespace-nowrap outline-none;
		@apply hover:bg-black/5 focus-visible:bg-black/5;
		@apply dark:hover:bg-white/10 dark:focus-visible:bg-white/10;
		@apply data-[state=open]:bg-accent-light/20 dark:data-[state=open]:bg-white/20;
		@apply not-dark:data-[state=open]:text-accent-secondary;
	}

	.submenu-item {
		@apply block cursor-pointer px-3 py-1.5 text-sm font-semibold outline-none;
		@apply hover:bg-neutral-100 focus-visible:bg-neutral-100 data-[highlighted]:bg-neutral-100;
		@apply dark:hover:bg-white/10 dark:focus-visible:bg-white/10 dark:data-[highlighted]:bg-white/10;
	}
</style>
