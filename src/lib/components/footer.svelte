<script>
	import LangSwitcher from './LangSwitcher.svelte'
	import { m } from '$lib/paraglide/messages'
	let { noJS } = $props()

	// 1. Define the object structure
	const footerSections = [
		{
			title: m.footerAbout(),
			links: [
				{ href: '/about', label: m.about() },
				{ href: '/amp-mod', label: 'AmpMod ≠ Amp Mods' },
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
				{ href: 'https://youtube.com/@ampmod', label: 'YouTube', external: true },
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

<footer class="w-full border-t border-neutral-300 p-4 dark:border-neutral-700">
	<div class="mx-auto max-w-5xl">
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

		<div class="flex justify-between gap-4">
			{#if !noJS}<LangSwitcher />{/if}
			<p class="text-xs">
				{m.footerNotAffiliated()}
			</p>
		</div>
	</div>
</footer>
