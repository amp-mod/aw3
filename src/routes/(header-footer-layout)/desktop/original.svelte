<script>
	import { Cog, ExternalLink } from '@lucide/svelte'
	import MicrosoftLogo from '~icons/simple-icons/microsoft'
	import AppleLogo from '~icons/simple-icons/apple'
	import LinuxLogo from '~icons/simple-icons/linux'
	import DebianLogo from '~icons/simple-icons/debian'
	import ArchLogo from '~icons/simple-icons/archlinux'
	import FlatpakLogo from '~icons/simple-icons/flatpak'
	import { onMount } from 'svelte'
	import * as bowser from 'bowser'
	import Button from '$lib/components/Button.svelte'

	let button = $state('anyplatform')

	onMount(() => {
		const browser = bowser.getParser(window.navigator.userAgent)
		if (browser.getPlatformType() === 'desktop') {
			const os = browser.getOS()
			if (os.name === 'Windows') {
				button = 'windows'
			} else if (os.name === 'macOS') {
				button = 'macos'
			} else if (os.name === 'Linux') {
				button = 'linux'
			}
		} else {
			button = 'unsupported-for-now'
		}
	})

	const linkStyles =
		'flex items-center gap-3 border border-accent/20 px-4 py-3 text-sm transition-colors hover:bg-accent/5 hover:border-accent/40'
</script>

<svelte:head>
	<title>Download - AmpMod</title>
</svelte:head>

<div
	class="flex flex-col items-center gap-6 border-b border-accent/10 bg-accent/[0.03] p-12 text-center"
>
	<h1 class="text-5xl font-bold text-accent">Download AmpMod</h1>
	<p class="max-w-xl text-lg opacity-80">A better way to create AmpMod projects.</p>

	<div class="mt-2 min-h-[48px]">
		{#if button === 'windows'}
			<Button href="/uploads/AmpMod-Setup.exe" class="inline-flex items-center gap-2">
				<MicrosoftLogo class="h-5 w-5" />
				Download for Windows
			</Button>
		{:else if button === 'macos'}
			<Button href="/uploads/AmpMod.dmg" class="inline-flex items-center gap-2">
				<AppleLogo class="h-5 w-5" />
				Download for macOS
			</Button>
		{:else if button === 'linux'}
			<div class="flex items-center gap-3">
				<Button href="/uploads/AmpMod.AppImage" class="inline-flex items-center gap-2">
					<Cog class="h-5 w-5" />
					Download AppImage
				</Button>
				<Button
					href="https://flathub.org/apps/org.ampmod.AmpMod"
					class="inline-flex items-center gap-2"
				>
					<FlatpakLogo class="h-5 w-5" />
					Download from Flathub
				</Button>
				<a href="#downloads" class="link">More...</a>
			</div>
		{:else if button === 'unsupported-for-now'}
			<div class="rounded border border-accent/30 px-6 py-2 text-sm font-medium text-accent">
				AmpMod isn't available on mobile yet.
			</div>
		{:else}
			<Button href="#downloads" class="px-8">View All Versions</Button>
		{/if}
	</div>
</div>

<!-- 3-Card Download Grid -->
<div id="downloads" class="m-auto my-16 grid max-w-6xl grid-cols-1 gap-8 px-6 md:grid-cols-3">
	<!-- Windows -->
	<div class="flex flex-col border border-accent/20 p-6">
		<div class="mb-6 flex items-center gap-3">
			<MicrosoftLogo class="h-6 w-6 text-accent" />
			<h2 class="text-xl font-bold">Windows</h2>
		</div>
		<div class="flex flex-col gap-3">
			<a href="/uploads/AmpMod-Setup.exe" class={linkStyles}>
				<span>Installer (x64)</span>
			</a>
			<a href="/uploads/AmpMod-Setup-ARM.exe" class={linkStyles}>
				<span>Installer (ARM)</span>
			</a>
			<a href="/uploads/AmpMod-Portable.exe" class={linkStyles}>
				<span>Portable EXE (x64)</span>
			</a>
		</div>
	</div>

	<!-- macOS -->
	<div class="flex flex-col border border-accent/20 p-6">
		<div class="mb-6 flex items-center gap-3">
			<AppleLogo class="h-6 w-6 text-accent" />
			<h2 class="text-xl font-bold">macOS</h2>
		</div>
		<div class="flex flex-col gap-3">
			<a href="/uploads/AmpMod.dmg" class={linkStyles}>
				<span>Universal DMG Installer</span>
			</a>
		</div>
	</div>

	<!-- Linux -->
	<div class="flex flex-col border border-accent/20 p-6">
		<div class="mb-6 flex items-center gap-3">
			<LinuxLogo class="h-6 w-6 text-accent" />
			<h2 class="text-xl font-bold">Linux</h2>
		</div>
		<div class="flex flex-col gap-3">
			<a href="https://flathub.org/apps/org.ampmod.AmpMod" class={linkStyles}>
				<FlatpakLogo class="h-4 w-4 opacity-70" />
				<span>Get on Flathub</span>
			</a>
			<a href="/uploads/AmpMod.AppImage" class={linkStyles}>
				<Cog class="h-4 w-4 opacity-70" />
				<span>Download AppImage</span>
			</a>
			<a href="/uploads/ampmod.deb" class={linkStyles}>
				<DebianLogo class="h-4 w-4 opacity-70" />
				<span>Debian / Ubuntu / etc.</span>
			</a>
			<a href="https://aur.archlinux.org/packages/ampmod-bin" class={linkStyles}>
				<ArchLogo class="h-4 w-4 opacity-70" />
				<span>AUR</span>
			</a>
		</div>
	</div>
</div>

<!-- Footer Info -->
<div
	class="m-auto mb-20 flex max-w-6xl flex-col gap-12 border-t border-accent/10 px-6 pt-12 md:flex-row"
>
	<div class="flex-1">
		<h3 class="mb-4 text-lg font-bold text-accent">Requirements</h3>
		<ul class="space-y-2 text-sm opacity-70">
			<li>Windows 10+ / macOS 13+ / modern Linux distribution</li>
			<li>2GB RAM</li>
			<li>1GB disk space</li>
		</ul>
	</div>
	<div class="flex-1">
		<h3 class="mb-4 text-lg font-bold text-accent">Generic HTML file</h3>
		<p class="mb-4 text-sm opacity-70">
			Run AmpMod offline in a browser. We would add PWA support to the editor itself, but
			unfortunately, custom extensions can exploit that to replace the editor with something else.
		</p>
		<p class="mb-4 text-sm opacity-70">
			Fair warning: This file is very large (over 10MB). Please only use it if you have to (e.g. you
			are on a school computer that doesn't allow running executables). The standalone version does
			not update automatically, and because of file size, internet is required to use the Music
			extension.
		</p>
		<a href="/downloads/AmpMod-Standalone.html" download class="link"> Download</a>
	</div>
</div>
