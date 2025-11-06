<!-- TODO: Add stuff for the website. This file is modified from website-v2 in ampmod/extensions.
     Styling is inspired by the AmpMod static website UI. -->
<script lang="ts">
  import Logo from './logo.svg';
</script>

<header
  class="flex h-12 w-full items-center border-b border-black/10 bg-white px-2 font-sans text-sm text-black md:px-4 dark:bg-accent-secondary dark:text-white"
>
  <div class="flex w-full items-center justify-center gap-4">
    <a href="/" class="logo-link flex items-center">
      <img
        src={Logo}
        draggable="false"
        height="28"
        alt="AmpMod"
        class="h-[28px] transition-transform duration-100 hover:scale-105"
      />
    </a>

    <div class="hidden items-center gap-2 md:flex">
      <a href="https://ampmod.codeberg.page/editor.html" class="header-link">Create</a>
      <a href="https://ampmod.codeberg.page/credits.html" class="header-link">Credits</a>
      <a href="https://ampmod.flarum.cloud" class="header-link">Discuss</a>
      <a href="https://codeberg.org/AmpMod" class="header-link">Contribute</a>
    </div>
  </div>
</header>
