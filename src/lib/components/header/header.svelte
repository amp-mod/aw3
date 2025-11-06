<!-- TODO: Add stuff for the website.  Copied from extension library because the one from ampmod-web-front somehow won't work. -->
<script lang="ts">
	import Logo from './logo.svg';
</script>

<header
	class="fixed top-0 left-0 z-10 flex h-[50px] w-full items-center border-b border-black/20 bg-accent px-2 font-sans text-sm text-white shadow-md md:px-4"
>
	<div class="flex w-full items-center gap-4">
		<a href="/" class="logo-link flex items-center">
			<img
				src={Logo}
				draggable="false"
				height="28"
				alt="AmpMod"
				class="h-[28px] transition-transform duration-100 hover:scale-105"
			/>
		</a>

		<div class="hidden items-center gap-2 md:flex">
			<a
				href="https://ampmod.codeberg.page/editor.html"
				class="header-link cursor-pointer rounded px-3 py-2 font-bold whitespace-nowrap hover:bg-black/10"
				>Create</a
			>
			<a
				href="https://ampmod.codeberg.page/credits.html"
				class="header-link cursor-pointer rounded px-3 py-2 font-bold whitespace-nowrap hover:bg-black/10"
				>Credits</a
			>
			<a
				href="https://ampmod.flarum.cloud"
				class="header-link cursor-pointer rounded px-3 py-2 font-bold whitespace-nowrap hover:bg-black/10"
				>Discuss</a
			>
			<a
				href="https://codeberg.org/AmpMod"
				class="header-link cursor-pointer rounded px-3 py-2 font-bold whitespace-nowrap hover:bg-black/10"
				>Contribute</a
			>
		</div>
	</div>
</header>
<div class="mt-[50px] w-full"></div>
