<script lang="ts">
  import Header from '$lib/components/header/header.svelte';
  import { page } from '$app/state';

  let { children } = $props();
  let accountOpen = $state(false);

  const navItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Projects', href: '/admin/projects' },
    { label: 'Studios', href: '/admin/studios' },
    { label: 'Front page management', href: '/admin/frontpage' }
  ];
</script>

<svelte:head>
  <title>Admin panel - AmpMod</title>
</svelte:head>

<div class="flex h-screen flex-col bg-white dark:bg-neutral-900">
  <!-- Header always on top -->
  <Header admin={true} />

  <!-- Wrap sidebar + main in a horizontal flex container -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar -->
    <aside
      class="flex w-72 flex-col border-r border-black/10 bg-white dark:border-accent-tertiary dark:bg-accent-secondary"
    >
      <!-- Navigation -->
      <nav class="mt-3 flex flex-1 flex-col">
        {#each navItems as item}
          <a
            href={item.href}
            class={`mb-1 block border-t border-b border-black/10 px-3 py-2 text-right dark:border-accent-tertiary
              ${
                page.url.pathname === item.href
                  ? 'bg-accent-tertiary font-bold text-white dark:bg-white dark:text-accent-secondary'
                  : 'hover:bg-accent/20 dark:hover:bg-white/10'
              }`}>{item.label}</a
          >
        {/each}
      </nav>

      <!-- Account dropdown -->
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

    <!-- Main content area -->
    <main class="flex-1 overflow-y-auto p-4">
      {@render children?.()}
    </main>
  </div>
</div>
