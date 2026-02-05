<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.ico';

  let { children, data } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>AmpMod</title>
</svelte:head>

{@render children?.()}

{#if data?.isDangerousMode}
  <div
    class="pointer-events-none fixed right-4 bottom-4 z-50 text-xl font-bold text-red-500 opacity-50"
  >
    Insecure
  </div>
{/if}
