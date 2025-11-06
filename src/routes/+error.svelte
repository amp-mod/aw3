<script>
  import NewLayout from './(header-footer-layout)/+layout.svelte';
  import { page } from '$app/state';

  let friendlyMessage;

  switch (page.status) {
    case 404:
    case 410:
      friendlyMessage =
        "The page or file you're looking for doesn't exist. If you followed a link to this on a website, please inform the owner that the link is broken.";
      break;
    case 403:
      friendlyMessage = "You don't have permission to access this resource. Try logging in.";
      break;
    case 500:
    case 503:
      friendlyMessage = 'An error occured. Please try again later.';
      break;
    case 418:
      friendlyMessage = 'This site is a teapot and cannot brew coffee.';
      break;
    default:
      friendlyMessage = page.error?.message ?? 'Something went wrong.';
  }
</script>

<svelte:head>
  <title>{page.status} - AmpMod</title>
</svelte:head>

<NewLayout>
  <main class="mx-auto my-20 max-w-4xl p-4 text-center">
    <h1 class="font-mono text-8xl font-bold tracking-widest text-red-500 dark:text-red-400">
      {page.status}
    </h1>
    <p class="mt-4 text-2xl text-neutral-600 dark:text-white">
      {friendlyMessage}
    </p>
    <div class="mt-4">
      <a class="btn" href="/">Back to homepage</a>
    </div>
  </main>
</NewLayout>
