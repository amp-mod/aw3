<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.ico';
  import Header from '$lib/components/header/header.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen flex-col">
  <Header />
  <main class="flex-1 overflow-auto">
    {@render children?.()}
  </main>
</div>
