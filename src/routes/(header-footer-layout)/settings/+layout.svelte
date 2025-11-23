<script lang="ts">
  import { ExternalLink } from '@lucide/svelte';
  import { page } from '$app/state';

  const { children } = $props();

  const tabs = [
    { label: 'Website' },
    { id: 'profile', label: 'Profile', href: '/settings/profile' },
    { id: 'account', label: 'Account', href: '/settings/account' },
    { id: 'danger', label: 'Danger zone', href: '/settings/danger' },
    { label: 'Editor' },
    { id: 'theme', label: 'Themes', href: '/settings/theme' },
    {
      id: 'addons',
      label: 'Addons',
      href: '/settings/addons',
      externalIcon: true
    }
  ];
</script>

<h1 class="mx-auto mt-8 mb-4 max-w-5xl text-3xl font-bold text-black dark:text-white">Settings</h1>
<div
  class="mx-auto mb-24 flex min-h-120 max-w-5xl overflow-hidden rounded-xl border border-black/10 bg-neutral-100 dark:bg-neutral-800"
>
  <nav class="flex w-64 flex-col gap-2 bg-neutral-200 p-4 dark:bg-neutral-700">
    {#each tabs as tab}
      {#if !tab.id}
        <div class="gao-3 flex w-full items-center">
          <div class="font-bold">{tab.label}</div>
          <div class="ml-4 w-full border-t border-t-neutral-500/30"></div>
        </div>
      {:else}
        <a
          id={tab.id}
          class="rounded px-3 py-2 text-left text-black transition-colors hover:bg-black/10 dark:text-white dark:hover:bg-white/10
               {page.url.pathname === tab.href ? 'bg-black/10 font-semibold dark:bg-white/10' : ''}"
          href={tab.href}
          target={tab.externalIcon ? '_blank' : null}
          aria-current={page.url.pathname === tab.href}
        >
          <div class="flex items-center justify-between">
            <div class="inline-flex items-center gap-2">{tab.label}</div>
            {#if tab.externalIcon}<ExternalLink size={18} class="text-black dark:text-white" />{/if}
          </div>
        </a>
      {/if}
    {/each}
  </nav>
  <div class="flex-1 p-6 text-black dark:text-white">
    {@render children()}
  </div>
</div>
