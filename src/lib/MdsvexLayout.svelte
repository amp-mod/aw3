<script lang="ts">
	import { onMount } from 'svelte'

	let { children, title } = $props()

	let headings = $state<{ id: string; text: string; level: number }[]>([])

	$effect(() => {
		// Select headers only within the prose container
		const container = document.querySelector('.prose-content')
		if (container) {
			const foundHeadings = Array.from(container.querySelectorAll('h2, h3'))

			headings = foundHeadings.map((h, index) => {
				// Ensure every heading has an ID for linking
				if (!h.id) {
					h.id = `Section${index + 1}`
				}
				return {
					id: h.id,
					text: h.textContent || '',
					level: parseInt(h.tagName.replace('H', '')),
				}
			})
		}
	})
</script>

<svelte:head>
	<title>{title} - AmpMod</title>
</svelte:head>

<div class="bg-accent-secondary p-6 text-white">
	<h1 class="m-auto max-w-5xl text-3xl font-bold">{title}</h1>
</div>

<div class="m-auto flex max-w-5xl flex-col gap-8 py-4 lg:flex-row">
	<!-- Main Content -->
	<div
		class="prose-content text-text prose max-w-5xl flex-1 leading-6 text-black dark:text-white dark:prose-invert prose-a:text-accent dark:prose-a:text-accent-light"
	>
		{@render children()}
	</div>
	<!-- Table of Contents Sidebar -->
	<nav class="w-full shrink-0 lg:w-64">
		{#if headings.length > 0}
			<div class="sticky top-4">
				<p class="mb-4 font-bold">Table of contents</p>
				<ul class="space-y-2 border-l border-gray-200 dark:border-gray-800">
					{#each headings as heading}
						<li class="pl-4" style:margin-left={heading.level === 3 ? '1rem' : '0'}>
							<a
								href="#{heading.id}"
								class="block text-sm hover:text-accent dark:text-gray-400 dark:hover:text-accent-light"
							>
								{heading.text}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</nav>
</div>
