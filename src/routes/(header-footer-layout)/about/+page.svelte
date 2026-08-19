<script>
	import { onMount } from 'svelte'
	import {
		ListTree,
		Puzzle,
		Type,
		History,
		Shapes,
		ArrowRight,
		Code,
		Paintbrush,
		Globe,
		BotOff,
		ShieldCheck,
		CircleCheck,
		CircleX,
		TriangleAlert,
		Palette,
		Info,
		Check,
		XIcon,
		Minus,
		CaseSensitive,
		Brackets,
		Square,
	} from '@lucide/svelte'
	import HeroImg from '$lib/assets/apple-cat-programming.svg'

	const words = ['Block-based coding', 'Game development', 'Project sharing']

	let displayText = ''
	let wordIndex = 0
	let isDeleting = false
	let speed = 25
	let timer

	function type() {
		const currentWord = words[wordIndex] + '.'

		if (isDeleting) {
			displayText = currentWord.substring(0, displayText.length - 1)
			speed = 40
		} else {
			displayText = currentWord.substring(0, displayText.length + 1)
			speed = 25
		}

		if (!isDeleting && displayText === currentWord) {
			isDeleting = true
			speed = 2000
		} else if (isDeleting && displayText === '') {
			isDeleting = false
			wordIndex = (wordIndex + 1) % words.length
			speed = 500
		}

		timer = setTimeout(type, speed)
	}

	onMount(() => {
		type()
		return () => clearTimeout(timer)
	})

	const styles = {
		grid_section: 'grid md:grid-cols-2 lg:grid-cols-3 gap-8',
		feature: `
            group relative p-8 rounded-xl border-2 transition-all duration-200
            bg-white border-neutral-200
            dark:bg-neutral-900 dark:border-neutral-800
        `,
		icon: 'text-accent mb-6',
		h2: `
            text-3xl font-pixelify mb-12 px-4 py-1 
            text-white rounded-lg w-full
            inline-flex gap-3 items-center justify-center
        `,
	}

	const programmingFeatures = [
		{
			icon: Brackets,
			title: 'First-class lists',
			desc: 'AmpMod adds "arrays", a new alternative to lists that can store more than just text. You can even store arrays inside of arrays!',
		},
		{
			icon: CaseSensitive,
			title: 'Case sensitivity',
			desc: 'In project settings, go to Danger Zone then turn on Case Sensitivity. Blocks will now distinguish uppercase and lowercase letters.',
		},
		{
			icon: Puzzle,
			title: 'Extensions',
			desc: 'From All Menus to Zip, we have everything you need to make a great project.',
		},
	]

	const paintFeatures = [
		{
			icon: Type,
			title: 'Custom fonts',
			desc: 'Amplification and Comic are included fonts. Also, you can load .ttf/.otf/.woff2 files or system fonts.',
		},
		{
			icon: Square,
			title: 'Rounded rectangle',
			desc: 'You can create a rounded rectangle shape by selecting the rounded rectangle tool.',
		},
		/*{
			icon: Palette,
			title: 'Advanced Gradients',
			desc: 'Create complex linear and radial gradients with multiple color stops.',
		},*/ // we don't have it yet but we'd love to add it eventually.
	]

	const communityFeatures = [
		{
			icon: BotOff,
			title: 'Privacy Focused',
			desc: 'Your data stays yours. We are committed to not training AI models on user projects.',
		},
		{
			icon: ShieldCheck,
			title: 'Safe Sharing',
			desc: 'Share and collaborate on projects in a secure environment.',
		},
		{
			icon: Globe,
			title: 'Free software',
			desc: 'Export projects as standalone apps. Your creations belong to you.',
		},
	]

	const YES = Check
	const NO = XIcon
	const PARTIAL = Minus

	const comparisonFeatures = [
		{
			name: 'First-class lists',
			desc: 'Allows lists to be stored inside variables or other lists.',
			scratch: { icon: NO },
			tw: { icon: NO },
			pmod: { icon: PARTIAL, note: 'Via extension' },
			ampmod: { icon: YES, note: 'Built-in' },
		},
		{
			name: 'Case sensitivity',
			desc: 'Allows blocks to between uppercase and lowercase letters.',
			scratch: { icon: NO },
			tw: { icon: PARTIAL, note: 'Via extensions' },
			pmod: { icon: PARTIAL, note: 'Via extensions' },
			ampmod: { icon: YES, note: 'Via danger zone setting' },
		},
		{
			name: 'Compiler',
			desc: 'Converts projects to JavaScript for noticeable speed gains.',
			scratch: { icon: NO },
			tw: { icon: YES },
			pmod: { icon: PARTIAL, note: 'Outdated version' },
			ampmod: { icon: YES },
		},
		{
			name: 'Custom fonts',
			desc: 'Support for custom fonts.',
			scratch: { icon: NO },
			tw: { icon: YES },
			pmod: { icon: YES },
			ampmod: { icon: YES },
		},
		{
			name: 'Extensions',
			desc: 'Additional blocks from the gallery.',
			scratch: { icon: PARTIAL, note: 'Official only' },
			tw: { icon: YES },
			pmod: { icon: YES },
			ampmod: { icon: YES },
		},
		{
			name: 'Project sharing',
			desc: 'Share your projects with the world.',
			scratch: { icon: YES },
			tw: { icon: PARTIAL /* share.turbowarp.org */ },
			pmod: { icon: YES },
			ampmod: { icon: YES },
		},
		{
			name: 'Galleries',
			desc: 'Organise projects in collections.',
			scratch: { icon: YES, note: 'Studios' },
			tw: { icon: NO },
			pmod: { icon: NO },
			ampmod: { icon: YES },
		},
		{
			name: 'Forum support',
			desc: 'Support from the community.',
			scratch: { icon: YES },
			tw: { icon: NO },
			pmod: { icon: PARTIAL, note: 'Poorly moderated' },
			ampmod: { icon: YES },
		},
		{
			name: 'Wiki support',
			desc: 'A website documenting the history of the community and how to program.',
			scratch: { icon: PARTIAL, note: 'Semi-official' },
			tw: { icon: NO },
			pmod: { icon: YES },
			ampmod: { icon: YES },
		},
	]
</script>

<svelte:head>
	<title>About AmpMod</title>
</svelte:head>

<div class="m-auto max-w-6xl px-8 py-16 text-neutral-900 dark:text-neutral-100">
	<header
		class="mb-32 flex flex-col items-center justify-between gap-12 rounded-xl bg-accent p-6 text-white md:flex-row"
	>
		<div class="max-w-3xl">
			<h1 class="mb-6 min-h-[140px] text-5xl leading-tight md:min-h-0">
				{displayText}<span class="animate-pulse border-r-4"></span><br />
				<span class="font-pixelify font-bold">Amplified.</span>
			</h1>
			<div class="flex gap-4">
				<a
					href="/projects/editor"
					class="flex items-center gap-2 rounded-full bg-white px-6 py-2 font-bold text-accent"
				>
					Try now <ArrowRight size={20} />
				</a>
				<a
					href="/auth/register"
					class="flex items-center gap-2 rounded-full border-2 border-white px-6 py-2 font-bold text-white"
				>
					Join community
				</a>
			</div>
		</div>
		<div>
			<img src={HeroImg} alt="Mascot" class="relative z-10 h-48 w-auto" />
		</div>
	</header>

	<section class="mb-24">
		<h2 class="{styles.h2} bg-accent"><Code /> Programming Features</h2>
		<div class={styles.grid_section}>
			{#each programmingFeatures as item}
				<div class={styles.feature}>
					<svelte:component this={item.icon} size={36} class={styles.icon} />
					<h3 class="mb-3 text-xl font-bold">{item.title}</h3>
					<p class="leading-relaxed text-neutral-500 dark:text-neutral-400">{item.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="mb-24">
		<h2 class="{styles.h2} bg-purple-700"><Paintbrush /> Paint Editor Features</h2>
		<div class={styles.grid_section}>
			{#each paintFeatures as item}
				<div class={styles.feature}>
					<svelte:component this={item.icon} size={36} class={styles.icon} />
					<h3 class="mb-3 text-xl font-bold">{item.title}</h3>
					<p class="leading-relaxed text-neutral-500 dark:text-neutral-400">{item.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="mb-24">
		<h2 class="{styles.h2} bg-blue-600"><ListTree /> Feature Comparison</h2>

		<div
			class="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
		>
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead class="bg-neutral-50 dark:bg-neutral-800/50">
						<tr class="text-xs text-neutral-500">
							<th class="border-b border-neutral-200 p-4 font-bold dark:border-neutral-800"
								>Feature & Description</th
							>
							<th
								class="border-b border-neutral-200 p-4 text-center font-bold dark:border-neutral-800"
								>Scratch</th
							>
							<th
								class="border-b border-neutral-200 p-4 text-center font-bold dark:border-neutral-800"
								>TurboWarp</th
							>
							<th
								class="border-b border-neutral-200 p-4 text-center font-bold dark:border-neutral-800"
								>[flightless bird] <!-- This is PenguinMod, but due to rules we can't mention the name on the site.--></th
							>
							<th
								class="border-b border-neutral-200 p-4 text-center font-bold text-accent dark:border-neutral-800"
								>AmpMod</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
						{#each comparisonFeatures as item}
							<tr class="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
								<td class="p-4">
									<div class="leading-tight font-bold">{item.name}</div>
									<div class="mt-0.5 text-[10px] text-neutral-500 sm:text-xs">{item.desc}</div>
								</td>

								{#each ['scratch', 'tw', 'pmod', 'ampmod'] as platform}
									{@const Icon = item[platform].icon}
									<td class="p-4 text-center align-top">
										<div class="flex flex-col items-center gap-1">
											<Icon
												size={20}
												class="inline {item[platform].icon === YES
													? 'text-green-500'
													: item[platform].icon === PARTIAL
														? 'text-yellow-500'
														: 'text-red-500'}"
											/>
											{#if item[platform].note}
												<span class="text-sm">
													{item[platform].note}
												</span>
											{/if}
										</div>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="mt-6 flex flex-wrap gap-6 px-2 text-xs text-neutral-500">
			<span class="flex items-center gap-1"
				><Check size={14} class="text-green-500" /> Supported</span
			>
			<span class="flex items-center gap-1"
				><Minus size={14} class="text-yellow-500" /> Limited</span
			>
			<span class="flex items-center gap-1"
				><XIcon size={14} class="text-red-500" /> No support</span
			>
		</div>
	</section>

	<p class="mt-8 text-sm text-neutral-500 italic">
		Are you an educator? <a href="/auth/register/teacher" class="text-accent hover:underline"
			>Sign up for an AmpMod education account.</a
		>
	</p>
</div>
