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
				// { href: '/about3d', label: 'About AmpMod 3D' },
				{ href: '/desktop', label: 'Download' },
				{ href: '/amp-mod', label: 'AmpMod \u2260 amp mods' },
				{ href: '/faq', label: m.faq() },
				//{ href: '/history', label: 'History of AmpMod' },
				//{ href: '/credits', label: m.credits() },
				{
					href: 'https://ampmod.flarum.cloud/t/applications',
					label: 'Join AmpMod Team',
					external: true,
				},
			],
		},
		{
			title: m.footerCommunity(),
			links: [
				{ href: '/projects/explore', label: m.exploreProjects() },
				// { href: '/events', label: 'Ongoing Events' },
				{ href: 'https://ampmod.flarum.cloud', label: 'AmpMod Forums', external: true },
				{ href: 'https://ampmod.miraheze.org', label: m.footerWiki(), external: true },
				// Do not localise!
				{ href: 'https://youtube.com/@ampmod', label: 'YouTube', external: true },
			],
		},
		{
			title: m.footerResources(),
			links: [
				{ href: 'https://ampblog.flarum.cloud', label: m.footerBlog(), external: true },
				{ href: '/source-code', label: m.sourceCode() },
				{ href: '/help', label: 'Help Center' },
				{ href: 'https://codeberg.org/ampmod/-/projects/30002', label: 'Roadmap', external: true },
			],
		},
		{
			title: m.footerPolicy(),
			links: [
				{ href: '/guidelines', label: m.guidelines() },
				{ href: '/terms', label: m.termsOfService() },
				{ href: '/privacy', label: m.privacyPolicy() },
				//{ href: '/cookies', label: 'Cookie Notice' },
				//{ href: '/dmca', label: 'DMCA' },
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

		<div class="flex flex-col items-center gap-4">
			{#if !noJS}<LangSwitcher />{/if}
			<div class="flex max-w-5xl flex-col gap-2 text-center text-xs">
				<p>
					Copyright &copy; 2024-{new Date().getFullYear()} AmpMod. AmpMod is not affiliated with Scratch,
					the Scratch Team, the Scratch Foundation, TurboWarp, or GarboMuffin. For more information on
					user content licencing, see the <a href="/terms" class="link">Terms of Service</a>.
				</p>
				<p>
					aw3 version {import.meta.env.VITE_NPM_PACKAGE_VERSION}
				</p>
			</div>
		</div>
	</div>
</footer>
