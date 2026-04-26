<script lang="ts">
	import { MessageSquare, ExternalLink, Calendar, User } from '@lucide/svelte'
	import Button from '$lib/components/Button.svelte'
	import { getPfpPath } from '$lib/storage-helpers'

	let { data } = $props()

	const post = $derived(data.post)

	const styles = {
		sectionCard:
			'border border-neutral-300 dark:border-neutral-700 rounded p-4 bg-white dark:bg-neutral-900',
		label:
			'text-sm font-bold text-accent-secondary dark:text-neutral-300 mb-2 block flex items-center gap-2',
		prose: `
            prose prose-neutral dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:tracking-tight
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:border prose-img:border-neutral-200 dark:prose-img:border-neutral-800
        `,
	}
</script>

<svelte:head>
	<title>{post.title} - AmpMod Blog</title>
</svelte:head>

<div class="m-auto flex max-w-5xl flex-col gap-6 lg:p-8">
	<header class="flex flex-col gap-4 border-b border-neutral-200 pb-8 dark:border-neutral-800">
		<div class="flex items-center gap-2 text-sm font-semibold tracking-wider text-accent">
			{post.tag}
		</div>

		<h1 class="text-4xl leading-tight font-extrabold text-neutral-800 lg:text-5xl dark:text-white">
			{post.title}
		</h1>

		<div class="flex items-center gap-4">
			<div class="flex flex-col">
				<span class="flex items-center gap-1 text-xs text-neutral-500">
					<Calendar size={12} />
					{new Date(post.createdAt).toLocaleDateString('en-GB', {
						day: 'numeric',
						month: 'long',
						year: 'numeric',
					})}
				</span>
			</div>
		</div>
	</header>

	<div class="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_300px]">
		<article class={styles.prose}>
			{@html post.contentHtml}
		</article>
	</div>
</div>
