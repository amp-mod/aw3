<script lang="ts">
	import { NavigationMenu } from 'bits-ui'
	import Logo from './tw-advanced.svelte'
	import { modals } from '$lib/modals.svelte'
	import {
		MenuIcon,
		X,
		Search,
		UserRound,
		TriangleAlert,
		ChevronDown,
		HatGlasses,
	} from '@lucide/svelte'

	let { admin = false, data } = $props()
	let menuOpen = $state(false)

	async function logout() {
		try {
			const res = await fetch('/auth/logout', { method: 'POST' })
			if (res.ok) location.reload()
		} catch (err) {
			console.error(err)
		}
	}
</script>

<a
	href="#main"
	class="sr-only z-50 text-2xl font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-accent-tertiary focus:p-2 focus:text-white"
>
	Skip to main content
</a>

<header
	class="flex h-14 w-full items-center border-b border-black/10 bg-white px-3 font-sans text-sm text-black md:px-6 dark:bg-accent-secondary dark:text-white"
>
	<div class="flex w-full items-center justify-between">
		<a
			href={admin ? '/admin' : '/'}
			aria-label="AmpMod homepage"
			class="header-link flex items-center text-xl"
		>
			<span class="flex items-center gap-1 font-semibold">
				{#if admin}
					<TriangleAlert /> <span>Admin panel</span>
				{:else}
					<Logo /> AmpMod
				{/if}
			</span>
		</a>

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

		<NavigationMenu.Root class="relative z-10 flex items-center">
			<NavigationMenu.List
				class="absolute top-14 left-0 z-40 hidden w-full flex-col items-start gap-2 border-t border-black/10 bg-white p-4 shadow-lg md:static md:flex md:w-auto md:flex-row md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none dark:border-white/20 dark:bg-accent-secondary"
			>
				{#if admin}
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/">
							{#snippet child({ props })}
								<a {...props} class="header-link w-full md:w-auto">Back to home</a>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				{:else}
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/projects/editor" data-sveltekit-reload>
							{#snippet child({ props })}
								<a {...props} class="header-link w-full md:w-auto">Create</a>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/projects/explore">
							{#snippet child({ props })}
								<a {...props} class="header-link w-full md:w-auto">Explore</a>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
					<NavigationMenu.Item>
						<NavigationMenu.Link href="/about">
							{#snippet child({ props })}
								<a {...props} class="header-link w-full md:w-auto">About</a>
							{/snippet}
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				{/if}

				<form
					role="search"
					aria-label="Site search"
					class="relative flex items-center md:ml-2"
					onsubmit={(e) => e.preventDefault()}
				>
					<input
						type="search"
						placeholder="Search..."
						class="h-8 w-36 rounded-lg border border-neutral-300 bg-transparent px-3 pr-12 text-sm outline-none focus:border-accent-secondary sm:w-44 md:w-48 dark:border-white/20 dark:focus:border-white"
					/>
					<button
						type="submit"
						class="absolute top-1/2 right-1 flex -translate-y-1/2 items-center justify-center rounded bg-accent-secondary px-2.5 py-1 text-white hover:bg-accent-tertiary dark:bg-white/10 dark:hover:bg-white/20"
					>
						<Search class="h-4 w-4" />
					</button>
				</form>

				<div
					class="hidden h-5 self-center border-l border-neutral-300 md:block dark:border-white/20"
				></div>

				<NavigationMenu.Item value="profile" openOnHover={false}>
					<NavigationMenu.Trigger>
						{#snippet child({ props })}
							<button {...props} class="header-link flex items-center gap-2">
								{#if data.user}<UserRound class="h-4 w-4" />{:else}<HatGlasses
										class="h-4 w-4"
									/>{/if}
								{data?.user?.username || 'Not logged in'}
								<ChevronDown
									class="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
								/>
							</button>
						{/snippet}
					</NavigationMenu.Trigger>

					<NavigationMenu.Content
						class="absolute top-full right-0 z-50 mt-2 w-40 overflow-hidden rounded-md border border-neutral-300 bg-white shadow-lg dark:border-white/20 dark:bg-accent-secondary"
					>
						<ul class="flex flex-col p-1">
							{#if data.user}
								<li>
									<NavigationMenu.Link href={`/users/${data.user.username}`}>
										{#snippet child({ props })}<a {...props} class="submenu-item">Profile</a
											>{/snippet}
									</NavigationMenu.Link>
								</li>
								<li>
									<NavigationMenu.Link href="/settings">
										{#snippet child({ props })}<a {...props} class="submenu-item">Settings</a
											>{/snippet}
									</NavigationMenu.Link>
								</li>
								<li>
									<button onclick={logout} class="submenu-item w-full text-left">Log out</button>
								</li>
							{:else}
								<li>
									<button
										onclick={() => (modals.login = true)}
										class="submenu-item w-full text-left">Log in</button
									>
								</li>
								<li>
									<NavigationMenu.Link href="/auth/register">
										{#snippet child({ props })}<a {...props} class="submenu-item">Join AmpMod</a
											>{/snippet}
									</NavigationMenu.Link>
								</li>
								<li>
									<NavigationMenu.Link href="/settings">
										{#snippet child({ props })}<a {...props} class="submenu-item">Settings</a
											>{/snippet}
									</NavigationMenu.Link>
								</li>
							{/if}
						</ul>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
			</NavigationMenu.List>
		</NavigationMenu.Root>
	</div>
</header>

<style>
	@reference '../../../app.css';

	.header-link {
		@apply flex h-9 cursor-pointer items-center rounded-lg px-3 font-bold whitespace-nowrap transition-colors outline-none;

		@apply hover:bg-black/5 focus-visible:bg-black/5;
		@apply dark:hover:bg-white/10 dark:focus-visible:bg-white/10;

		@apply data-[state=open]:bg-accent-light/20 dark:data-[state=open]:bg-white/20;
		@apply not-dark:data-[state=open]:text-accent-secondary;
	}

	.submenu-item {
		@apply block cursor-pointer rounded-sm px-3 py-2 text-sm transition-colors outline-none;

		@apply hover:bg-neutral-100 focus-visible:bg-neutral-100 data-[highlighted]:bg-neutral-100;
		@apply dark:hover:bg-white/10 dark:focus-visible:bg-white/10 dark:data-[highlighted]:bg-white/10;
	}
</style>
