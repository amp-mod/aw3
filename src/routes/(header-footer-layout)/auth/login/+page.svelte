<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  let { form }: { form: ActionData } = $props();
</script>

<form
  method="post"
  action="?/login"
  use:enhance
  class="m-auto flex max-w-2xl flex-col gap-3 px-2 py-8"
>
  <h1 class="text-2xl">Login</h1>
  <label>
    Username
    <input name="username" class="input" />
  </label>
  <label>
    Password
    <input type="password" name="password" class="input" />
  </label>
  <button type="submit" class="btn">Login</button>
  <p class="text-red-500">{form?.message ?? ''}</p>
</form>
