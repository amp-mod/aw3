<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import { browser } from '$app/environment';
  let loading = $state(true);
  if (browser) {
    import('altcha');
    loading = false;
  }

  let { form }: { form: ActionData } = $props();
</script>

<form
  method="post"
  action="?/register"
  use:enhance
  class="m-auto flex max-w-2xl flex-col gap-3 px-2 py-8"
>
  <h1 class="text-2xl">Join AmpMod</h1>
  <label>
    Username
    <input name="username" class="input" required />
  </label>
  <label>
    Password
    <input type="password" name="password" class="input" required />
  </label>
  <label>
    Confirm password
    <input type="password" name="password2" class="input" required />
  </label>
  {#if !loading}<altcha-widget
      auto="onsubmit"
      challengeurl="/auth/_altcha"
      floating
      class="text-black"
    ></altcha-widget>{/if}
  <button class="btn" disabled={loading}>Register</button>
  <p class="text-red-500">{form?.message ?? ''}</p>
</form>
