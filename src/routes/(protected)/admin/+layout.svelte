<script lang="ts">
	import Header from '$lib/components/header.svelte'
	import { page } from '$app/state'

	let { children, data } = $props()
	let accountOpen = $state(false)

	const navItems = [
		{ label: 'Dashboard', href: '/admin' },
		{ label: 'Users', href: '/admin/users' },
		{ label: 'Projects', href: '/admin/projects' },
		{ label: 'Studios', href: '/admin/studios' },
	]
</script>

<svelte:head>
	<title>Admin panel - AmpMod</title>
</svelte:head>

<div class="flex h-screen flex-col bg-white dark:bg-neutral-900">
	<Header admin={true} {data} />

	<div class="flex flex-1 overflow-hidden">
		<aside class="flex w-72 flex-col bg-neutral-200 p-4 dark:bg-neutral-800">
			<nav class="flex flex-1 flex-col">
				{#each navItems as item}
					<a
						href={item.href}
						class={`mb-1 block  rounded-xl px-3 py-2
              ${
								page.url.pathname === item.href
									? 'bg-neutral-300 font-bold dark:bg-neutral-700'
									: 'hover:bg-neutral-300 dark:hover:bg-neutral-700'
							}`}>{item.label}</a
					>
				{/each}
			</nav>

			<div class="p-2">
				{#if accountOpen}
					<div
						class="mt-2 flex flex-col rounded-md border border-neutral-300 bg-white shadow-lg dark:border-white/20 dark:bg-accent-secondary"
					>
						<a
							href="/auth/register"
							class="block px-3 py-2 text-sm hover:bg-accent/10 dark:hover:bg-white/10">Log out</a
						>
					</div>
				{/if}
			</div>
		</aside>

		<main class="flex-1 overflow-y-auto p-4">
			{@render children?.()}
		</main>
	</div>
</div>
