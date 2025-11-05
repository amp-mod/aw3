<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-96 justify-center">
	<div class="w-full max-w-md">
		<h1 class="mt-6 text-center text-2xl font-semibold text-gray-800 dark:text-gray-100">
			Login
		</h1>

		<form method="post" action="?/login" use:enhance class="space-y-5">
			<div>
				<label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
					Username
				</label>
				<input
					id="username"
					name="username"
					required
					class="mt-1 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-accent focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
					Password
				</label>
				<input
					id="password"
					type="password"
					name="password"
					required
					class="mt-1 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-accent focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				/>
			</div>

			<button
				type="submit"
				class="rounded-lg bg-accent px-4 py-1 text-white hover:bg-accent-secondary cursor-pointer font-bold"
			>
				Login
			</button>
		</form>

		{#if form?.message}
			<p class="mt-4 text-center text-sm text-red-500">{form.message}</p>
		{/if}
	</div>
</div>
