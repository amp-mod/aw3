<script lang="ts">
  import Logo from '$lib/components/header/tw-advanced.svelte';
  import { UserRound, Search } from '@lucide/svelte';
  let { children } = $props();
  let accountOpen = $state(false);
</script>

<div class="flex h-screen">
  <!-- Sidebar -->
  <aside
    class="flex min-w-72 flex-col border-r border-black/10 bg-neutral-100 dark:border-white/40 dark:bg-accent-secondary"
  >
    <!-- Logo -->
    <a
      href="/"
      class="x-3 m-2 flex items-center justify-center gap-2 rounded py-2 text-xl font-semibold hover:bg-accent/20 dark:hover:bg-white/10"
    >
      <Logo />
      AmpMod
    </a>

    <!-- Navigation -->
    <nav class="flex flex-1 flex-col space-y-1 p-2">
      <a href="/admin" class="block rounded px-3 py-2 hover:bg-accent/20 dark:hover:bg-white/10"
        >Dashboard</a
      >
      <a
        href="/admin/users"
        class="block rounded px-3 py-2 hover:bg-accent/20 dark:hover:bg-white/10">Users</a
      >
      <a
        href="/admin/projects"
        class="block rounded px-3 py-2 hover:bg-accent/20 dark:hover:bg-white/10">Projects</a
      >
      <a
        href="/admin/settings"
        class="block rounded px-3 py-2 hover:bg-accent/20 dark:hover:bg-white/10">Settings</a
      >
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
      <button
        class="flex w-full cursor-pointer items-center gap-2 p-2 text-left"
        onclick={() => (accountOpen = !accountOpen)}
        aria-haspopup="menu"
        aria-expanded={accountOpen}
      >
        <UserRound />
        <span>Account</span>
      </button>
    </div>
  </aside>

  <!-- Main content area -->
  <main class="flex-1 p-4">
    {@render children?.()}
  </main>
</div>
