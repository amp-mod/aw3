<script>
	const { data } = $props()
	const { UserData } = data
	import defaultPFP from '$lib/assets/default-pfp.png'
</script>

{#snippet UserCard({ image, text, href = null })}
	<a
		href={href ?? null}
		target="_blank"
		rel="noreferrer"
		class="flex flex-col items-center justify-center overflow-hidden rounded-[8px] border border-black/10 p-[16px] text-[0.9rem] text-inherit !no-underline hover:bg-black/5 hover:bg-black/10 hover:bg-white/5 dark:border-white/10"
	>
		<img
			loading="lazy"
			src={image || defaultPFP}
			alt={text}
			width="60"
			height="60"
			class="mb-[4px] h-[60px] w-[60px] rounded-[4px]"
		/>
		<div class="user-info ltr text-center [unicode-bidi:embed]">{text}</div>
		<!--{#if role}
			<div class="user-role mt-[2px] text-[0.7em]">{role}</div>
		{/if}-->
	</a>
{/snippet}

<div
	class="min-h-screen bg-neutral-50 font-['Inter_Variable','Helvetica_Neue',Helvetica,Arial,sans-serif] text-black dark:bg-neutral-900 dark:text-white"
>
	<header class="bg-accent-secondary px-0 py-8 text-center text-white">
		<div class="mx-auto max-w-[900px]">
			<h1 class="text-4xl font-bold">AmpMod Credits</h1>
		</div>
	</header>

	<main class="space-y-12 py-8">
		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<p class="leading-[1.5] italic opacity-80">
				Individual contributors are listed in no particular order. The order is randomized each
				visit.
			</p>
		</section>

		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<h2
				class="mb-4 border-b border-neutral-200 pb-2 text-2xl font-semibold dark:border-neutral-700"
			>
				Contributors
			</h2>
			<div class="grid grid-cols-5 gap-[12px]">
				{#each UserData.contributors as user}
					{@render UserCard(user)}
				{/each}
			</div>
		</section>

		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<h2
				class="mb-4 border-b border-neutral-200 pb-2 text-2xl font-semibold dark:border-neutral-700"
			>
				Server Hosting
			</h2>
			<div class="grid grid-cols-5 gap-[12px]">
				{#each UserData.serverAdmins as user}
					{@render UserCard(user)}
				{/each}
			</div>
		</section>

		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<h2
				class="mb-4 border-b border-neutral-200 pb-2 text-2xl font-semibold dark:border-neutral-700"
			>
				Addons
			</h2>
			<div class="grid grid-cols-5 gap-[12px]">
				{#each UserData.addonDevelopers as user}
					{@render UserCard(user)}
				{/each}
			</div>
		</section>

		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<h2
				class="mb-4 border-b border-neutral-200 pb-2 text-2xl font-semibold dark:border-neutral-700"
			>
				TurboWarp Extension Gallery
			</h2>
			<div class="grid grid-cols-5 gap-[12px]">
				{#each UserData.extensionDevelopers as user}
					{@render UserCard(user)}
				{/each}
			</div>
		</section>

		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<h2
				class="mb-4 border-b border-neutral-200 pb-2 text-2xl font-semibold dark:border-neutral-700"
			>
				TurboWarp
			</h2>
			<p class="mb-4 leading-[1.5] opacity-90">
				AmpMod is based on the work of the TurboWarp contributors but is not endorsed by TurboWarp
				in any way.
			</p>
			<div class="grid grid-cols-5 gap-[12px]">
				{#each UserData.tw as user}
					{@render UserCard(user)}
				{/each}
			</div>
		</section>

		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<h2 class="mb-2 text-2xl font-semibold">Scratch</h2>
			<p class="leading-[1.5]">
				AmpMod is based on the work of the Scratch contributors but is not endorsed by Scratch in
				any way.
			</p>
		</section>

		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<h2 class="mb-4 text-2xl font-semibold">Other Languages</h2>
			<p class="mb-2 leading-[1.5]">
				AmpMod uses code from other free and open-source programming languages but is not endorsed
				by any of them in any way.
			</p>
			<details class="group cursor-pointer">
				<summary class="link font-bold text-[#5cb1d6]"
					>Programming languages AmpMod is based on</summary
				>
				<ul class="mt-2 ml-4 list-disc">
					<li>
						<a href="https://librekitten.org" class="link text-[#5cb1d6] hover:underline"
							>LibreKitten</a
						>
					</li>
				</ul>
			</details>
		</section>

		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<h2 class="mb-2 text-2xl font-semibold">Favicon</h2>
			<p class="leading-[1.5]">
				The AmpMod favicon is based off an emoji from the <a
					href="https://gh.vercte.net/forumoji"
					class="link text-[#5cb1d6] hover:underline">Forumoji</a
				> project by lolecksdeehaha.
			</p>
		</section>

		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<h2 class="mb-2 text-2xl font-semibold">Translators</h2>
			<p class="leading-[1.5]">
				Our community has helped translate AmpMod into many languages - both the editor and this
				website.
			</p>
		</section>

		<section class="mx-auto max-w-[900px] px-[1em] min-[480px]:px-[1em] md:px-[1.5em]">
			<h2 class="mb-2 text-2xl font-semibold">Icons and other images</h2>
			<p class="leading-[1.5]">
				Some images use content from Openclipart, licensed under the CC0 license. Even though the
				images are public domain, we would still like to attribute.
			</p>
			<p class="leading-[1.5]">
				The remix icon is from Scratch-WWW and is licenced under BSD-3-Clause.
			</p>
		</section>
	</main>
</div>
