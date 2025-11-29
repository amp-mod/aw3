<script lang="ts">
  import Header from '$lib/components/header/header.svelte';
  import Footer from '$lib/components/footer/footer.svelte';

  let { children, data } = $props();
</script>

<div class="flex h-screen flex-col">
  <Header {data} />
  <div class="flex-1 overflow-auto shadow-inner" id="main">
    <main>
      {@render children?.()}
    </main>
    <Footer />
  </div>
</div>
