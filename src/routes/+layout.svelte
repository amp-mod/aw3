<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.ico';
  let { children, data } = $props();
  const { botDetected, botOverrideHTML } = $state(data);
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>AmpMod</title>
</svelte:head>

{#if botDetected}
  <div class="font-serif">
    {@html botOverrideHTML}
    <p>&copy; {new Date().getFullYear()} the author. Public domain.</p>
  </div>
{:else}
  {@render children?.()}
{/if}
