<script>
	import LangSwitcher from '../LangSwitcher.svelte'
	import { m } from '$lib/paraglide/messages'

	// 1. Define the object structure
	const footerSections = [
		{
			title: m.footerAbout(),
			links: [
				{ href: '/about', label: m.about() },
				{ href: '/credits', label: m.credits() },
			],
		},
		{
			title: m.footerCommunity(),
			links: [
				{ href: '/projects/explore', label: m.exploreProjects() },
				{ href: 'https://ampblog.flarum.cloud', label: m.footerBlog(), external: true },
				{ href: 'https://ampmod.miraheze.org', label: m.footerWiki(), external: true },
				// Do not localise!
				{ href: 'https://youtube.com/@Amp-Mod', label: 'YouTube', external: true },
			],
		},
		{
			title: m.footerResources(),
			links: [
				{ href: '/source-code', label: m.sourceCode() },
				{ href: '/faq', label: m.faq() },
			],
		},
		{
			title: m.footerPolicy(),
			links: [
				{ href: '/guidelines', label: m.guidelines() },
				{ href: '/terms', label: m.termsOfService() },
				{ href: '/privacy', label: m.privacyPolicy() },
			],
		},
	]
</script>

<footer class="w-full bg-neutral-100 p-4 dark:bg-neutral-800">
	<div class="mx-auto max-w-6xl">
		<nav class="mb-12 grid grid-cols-2 gap-8 text-sm md:grid-cols-4" aria-label="Footer Navigation">
			{#each footerSections as section}
				<div class="flex flex-col space-y-2">
					<h2 class="mb-1 font-bold text-neutral-900 dark:text-neutral-100">
						{section.title}
					</h2>
					<ul class="flex flex-col space-y-2">
						{#each section.links as link}
							<li>
								<a
									href={link.href}
									class="link"
									target={link.external ? '_blank' : null}
									rel={link.external ? 'noopener noreferrer' : null}
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</nav>

		<div class="flex flex-col items-center space-y-4">
			<LangSwitcher />
			<p class="max-w-md text-center text-xs opacity-75">
				{m.footerNotAffiliated()}
			</p>
		</div>
	</div>
</footer>
