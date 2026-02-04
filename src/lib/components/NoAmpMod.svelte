<script>
  let { path = '' } = $props();
</script>

<div class="mx-auto my-4 max-w-3xl border-l-8 border-red-500 bg-red-400/10 px-6 py-4">
  <p class="mb-2">
    This page is unavailable because an operator has not set up the AmpMod editor on this site. You
    can access this page at <a class="link" href={`https://ampmod.codeberg.page/${path}`}
      >ampmod.codeberg.page/{path}</a
    >.
  </p>
  <p class="text-xs">
    For operators: This software only includes the website, not the editor itself. Most sites are
    expected to intercept requests using a reverse proxy. To setup the editor, follow the
    instructions on the README.
  </p>
  <div class="mt-4">
    <a class="btn" href="/">Back to homepage</a>
  </div>
</div>
