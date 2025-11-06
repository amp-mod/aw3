<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-96 justify-center">
  <div class="w-full max-w-md">
    <h1 class="mt-6 text-center text-2xl font-semibold text-gray-800 dark:text-gray-100">
      Register
    </h1>

    <form method="post" action="?/register" use:enhance class="space-y-5">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Username
        </label>
        <input id="username" name="username" required class="input" />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <input id="password" type="password" name="password" required class="input" />
      </div>

      <div class="flex justify-between">
        <button type="submit" class="btn"> Register </button>
      </div>
    </form>

    {#if form?.message}
      <p class="mt-4 text-center text-sm text-red-500">{form.message}</p>
    {/if}
  </div>
</div>
