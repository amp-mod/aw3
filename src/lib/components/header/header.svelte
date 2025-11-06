<!-- TODO: Add stuff for the website. This file is modified from website-v2 in ampmod/extensions.
     Styling is inspired by the AmpMod static website UI. -->
<script lang="ts">
  import Logo from './tw-advanced.svelte';
  import { Menu, X, Search, User } from '@lucide/svelte';
  let menuOpen = false;
  let accountOpen = false;
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
    <!-- Logo -->
    <a
      href="/"
      aria-label="AmpMod homepage"
      class="flex items-center transition duration-200 ease-in-out hover:scale-120 not-dark:hover:text-accent"
    >
      <Logo />
    </a>

    <!-- Hamburger for small screens -->
    <button
      class="block p-2 text-xl focus:outline-none md:hidden"
      on:click={() => (menuOpen = !menuOpen)}
      aria-label="Toggle navigation"
    >
      {#if menuOpen}
        <X class="h-5 w-5" />
      {:else}
        <Menu class="h-5 w-5" />
      {/if}
    </button>

    <!-- Navigation -->
    <nav
      aria-label="Navigation"
      class="absolute top-14 left-0 z-40 hidden w-full flex-col items-start gap-2 border-t border-black/10 bg-white p-4 shadow-lg md:static md:flex md:w-auto md:flex-row md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none dark:border-white/20 dark:bg-accent-secondary"
      class:!flex={menuOpen}
    >
      <a href="https://ampmod.codeberg.page/editor.html" class="header-link w-full md:w-auto"
        >Create</a
      >
      <a href="https://ampmod.codeberg.page/credits.html" class="header-link w-full md:w-auto"
        >Credits</a
      >
      <a href="https://ampmod.flarum.cloud" class="header-link w-full md:w-auto">Discuss</a>
      <a href="https://codeberg.org/AmpMod" class="header-link w-full md:w-auto">Contribute</a>

      <!-- Search bar (slightly smaller) -->
      <form
        role="search"
        aria-label="Site search"
        class="relative flex items-center md:ml-2"
        on:submit|preventDefault={() => {
          /* hook up search here */
        }}
      >
        <input
          type="search"
          placeholder="Search..."
          class="h-8 w-36 rounded-lg border border-neutral-300 bg-transparent px-3 pr-12 text-sm outline-none focus:border-accent-secondary sm:w-44 md:w-48 dark:border-white/20 dark:focus:border-white"
        />
        <button
          type="submit"
          class="absolute top-1/2 right-1 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded bg-accent-secondary px-2.5 py-1 text-white hover:bg-accent-tertiary dark:bg-white/10 dark:hover:bg-white/20"
          aria-label="Search"
        >
          <Search class="h-4 w-4" />
        </button>
      </form>

      <div
        class="hidden h-5 self-center border-l border-neutral-300 md:block dark:border-white/20"
      ></div>

      <!-- Account dropdown -->
      <div class="relative">
        <button
          class="header-link flex items-center gap-2"
          on:click={() => (accountOpen = !accountOpen)}
          aria-haspopup="menu"
          aria-expanded={accountOpen}
        >
          <User />
        </button>

        {#if accountOpen}
          <div
            class="absolute right-0 mt-3 flex w-40 flex-col rounded-md border border-neutral-300 bg-white shadow-lg dark:border-white/20 dark:bg-accent-secondary"
          >
            <a
              href="/auth/register"
              class="block px-3 py-2 text-sm hover:bg-accent/10 dark:hover:bg-white/10"
              >Join AmpMod</a
            >
            <a
              href="/auth/login"
              class="block px-3 py-2 text-sm hover:bg-accent/10 dark:hover:bg-white/10">Log in</a
            >
          </div>
        {/if}
      </div>
    </nav>
  </div>
</header>
