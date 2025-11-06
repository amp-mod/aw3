<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.ico';
  import Header from '$lib/components/header/header.svelte';
  import Footer from '$lib/components/footer/footer.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen flex-col">
  <Header />
  <div class="flex-1 overflow-auto" id="main">
    <main>
      {@render children?.()}
    </main>
    <Footer />
  </div>
</div>
