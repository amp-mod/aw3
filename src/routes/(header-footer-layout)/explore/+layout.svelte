<script>
	import { m } from '$lib/paraglide/messages'
	import { page } from '$app/state'
	import { Flag, SquareStack } from '@lucide/svelte'

	let { children } = $props()
</script>

<div class="bg-accent-secondary p-8 text-center text-white">
	<h1 class="text-3xl font-bold">{m.explore()}</h1>
</div>

<!-- Navigation Bar -->
<div class="flex justify-center bg-neutral-100 dark:bg-neutral-800">
	<div class="flex space-x-12">
		<a
			href="/explore/projects"
			class="flex flex-col items-center gap-1.5 pt-4 pb-2 {page.url.pathname.startsWith(
				'/explore/projects',
			)
				? 'border-b-4 border-emerald-500 text-emerald-500'
				: 'text-neutral-600 dark:text-neutral-100'}"
		>
			<Flag class="h-6 w-6" />
			<span class="text-sm font-medium">Projects</span>
		</a>
		<a
			href="/explore/galleries"
			class="flex flex-col items-center gap-1.5 pt-4 pb-2 {page.url.pathname.startsWith(
				'/explore/galleries',
			)
				? 'border-b-4 border-emerald-500 text-emerald-500'
				: 'text-neutral-600 dark:text-neutral-100'}"
		>
			<SquareStack class="h-6 w-6" />
			<span class="text-sm font-medium">Galleries</span>
		</a>
	</div>
</div>

{@render children()}
