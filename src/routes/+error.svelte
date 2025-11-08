<script>
  import NewLayout from './(header-footer-layout)/+layout.svelte';
  import { page } from '$app/state';

  let friendlyMessage;

  switch (page.status) {
    case 404:
      friendlyMessage =
        "The page or file you're looking for doesn't exist. If you followed a link to this on a website, please inform the owner that the link is broken.";
      break;
    case 410:
      friendlyMessage =
        "The page or file you're looking for has been permanently removed. If you followed a link to this on a website, please inform the owner that the link is broken.";
      break;
    case 401:
      friendlyMessage = 'You must be logged in to access this page.';
      break;
    case 403:
      friendlyMessage = 'You are not allowed to access this page.';
      break;
    case 500:
      friendlyMessage =
        'An unknown error occured on the server. Please try reloading in a few minutes.';
      break;
    case 503:
      friendlyMessage =
        "AmpMod is currently down, most likely for maintenance. We'll keep you posted.";
      break;
    case 507:
      friendlyMessage = 'This server is currently out of storage and down for maintenance.';
      break;
    case 429:
      friendlyMessage = 'You are making too many requests to our website.';
      break;
    // Why not?
    case 418:
      friendlyMessage = 'This site is a teapot and cannot brew coffee or TurboWarp projects.';
      break;
    default:
      friendlyMessage = page.error?.message ?? 'An unknown error occured. Please try again.';
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
