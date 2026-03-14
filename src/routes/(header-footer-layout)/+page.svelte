<script>
	import { Tabs } from 'bits-ui'
	import { Clapperboard, Newspaper, Rss, UserRound, MapIcon } from '@lucide/svelte'
	import CreateCardIcon from '$lib/assets/apple-cat-programming-sm.svg'
	import HeroImg from '$lib/assets/apple-cat-programming.svg'
	import ExploreProjectsIcon from '$lib/assets/exploreprojects.svg'
	import Button from '$lib/components/Button.svelte'
	import { m } from '$lib/paraglide/messages'
	let { data } = $props()

	const styles = {
		button_normal: [
			'inline-flex',
			'rounded-lg',
			'bg-accent',
			'px-5 py-2',
			'items-center gap-2',
			'text-2xl font-bold',
			'bg-white text-accent',
			'hover:scale-115',
			'transition-all',
		].join(' '),
		button_small: [
			'inline-flex',
			'rounded-full',
			'bg-accent',
			'px-4 py-2',
			'items-center justify-center gap-2',
			'font-bold text-white',
		].join(' '),
		tab: [
			'cursor-pointer rounded-t-lg border border-neutral-300 bg-neutral-100 px-3 h-8 text-neutral-600',
			'outline-none border-b-0 flex items-center gap-3',
			'data-[state=active]:border-b-transparent',
			'data-[state=active]:bg-white',
			'data-[state=active]:text-accent-secondary',
			'data-[state=active]:h-10',
			'dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-300',
			'dark:data-[state=active]:bg-neutral-700 dark:data-[state=active]:text-white',
		].join(' '),
		card: 'flex flex-col gap-2 rounded-xl border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-accent h-50 justify-center',
	}
</script>

<svelte:head>
	<title>{data.user ? 'Front Page - AmpMod' : 'AmpMod - Block-based programming. amplified'}</title>
</svelte:head>

{#if data.user}
	<div class="m-auto flex min-h-100 max-w-6xl gap-3 p-8">
		<div class="flex grow basis-0 flex-col items-center justify-center gap-3">
			<img src={data.userPfp} alt="Your user icon" height={72} width={72} class="rounded" />
			<h1 class="text-2xl font-bold">Hello, {data.user.username}!</h1>
			<div class="flex items-center justify-center gap-1">
				<Button href="/projects/editor" data-sveltekit-reload>{m.createProject()}</Button>
				<Button href={`/users/${data.user.username}`}>{m.myProfile()}</Button>
				<Button href="/mystuff">{m.myStuff()}</Button>
			</div>
		</div>

		<div class="flex grow basis-0 flex-col gap-3">
			<Tabs.Root class="flex grow flex-col" value={data.user.rank === 0 ? 'welcome' : 'feed'}>
				<Tabs.List class="flex h-10 items-end gap-2 pl-4">
					{#if data.user.rank === 0}
						<Tabs.Trigger value="welcome" class={styles.tab}><MapIcon />Welcome</Tabs.Trigger>
					{/if}
					<Tabs.Trigger value="feed" class={styles.tab}><Rss />Feed</Tabs.Trigger>
					<Tabs.Trigger value="news" class={styles.tab}><Newspaper />Updates</Tabs.Trigger>
				</Tabs.List>

				{#if data.user.rank === 0}
					<Tabs.Content
						value="welcome"
						class="flex grow flex-col items-center justify-center gap-3 rounded-lg border border-yellow-400/30 bg-yellow-50 p-4 text-center dark:bg-yellow-900/20"
					>
						<h1 class="text-2xl font-bold">Welcome to AmpMod!</h1>
						<div class="grid w-full grid-cols-2 gap-4">
							<a href="/projects/editor" class={styles.card} data-sveltekit-reload>
								<img
									src={CreateCardIcon}
									class="h-28 object-contain"
									alt="An illustration of AmpMod's mascot, Apple Cat."
								/>
								<span class="font-bold">Make a Project</span>
							</a>

							<a href="/projects/explore" class={styles.card}>
								<img
									src={ExploreProjectsIcon}
									class="h-28 object-contain"
									alt="An illustration of 2 rounded squares on top of each other."
								/>
								<span class="font-bold">Explore</span>
							</a>
						</div>
					</Tabs.Content>
				{/if}

				<Tabs.Content
					value="feed"
					class="grow rounded-lg border border-neutral-300 bg-neutral-100 p-4 dark:border-neutral-500 dark:bg-neutral-800"
				>
					<p>skibidi toilet just subscribed to you yay</p>
				</Tabs.Content>

				<Tabs.Content
					value="news"
					class="grow rounded-lg border border-neutral-300 bg-neutral-100 p-4 dark:border-neutral-500 dark:bg-neutral-800"
				>
					<p>new update just dropped yay</p>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</div>
{:else}
	<div class="relative bg-accent p-9 text-white">
		<div class="m-auto flex max-w-6xl items-center justify-between">
			<div class="flex grow flex-col justify-center text-left">
				<h1 class="text-4xl leading-tight font-bold">Block-based programming, amplified</h1>
				<div class="mt-4 flex gap-6">
					<a href="/projects/editor" class={styles.button_normal}><Clapperboard /> Try it out</a>
					<a href="/auth/register" class={styles.button_normal}><UserRound /> Join</a>
				</div>
			</div>

			<div class="flex items-center justify-center">
				<img
					src={HeroImg}
					alt="An illustration of AmpMod's mascot, Apple Cat."
					class="h-38 w-full object-fill"
				/>
			</div>
		</div>

		<div
			style="clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%);"
			class="pointer-events-none absolute -bottom-6 left-36 h-6 w-24 -translate-x-1/2 bg-accent"
		></div>
	</div>

	<div
		class="bg-accent-light/30 p-4 text-accent-secondary dark:bg-accent-tertiary/80 dark:text-white"
	>
		<div class="flex justify-center gap-4">
			<a href="https://ampmod.codeberg.org/manual" class={styles.button_small}>Manual</a>
			<a href="https://ampmod.miraheze.org" class={styles.button_small}>AmpMod Wiki</a>
			<a href="https://codeberg.org/ampmod" class={styles.button_small}>Source Code</a>
		</div>
	</div>
{/if}
