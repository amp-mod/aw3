<script>
  import { page } from '$app/state';
  const username = $state(page.params.username);
</script>

<svelte:head>
  <title>@{username} - AmpMod</title>
</svelte:head>

<h1>{username}</h1>
