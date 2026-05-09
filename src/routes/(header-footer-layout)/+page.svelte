<script>
	import { Tabs } from 'bits-ui'
	import { Clapperboard, Newspaper, Rss, MapIcon, Sparkles, Link, Globe } from '@lucide/svelte'
	import CreateCardIcon from '$lib/assets/apple-cat-programming-sm.svg'
	import HeroImg from '$lib/assets/apple-cat-programming.svg'
	import ExploreProjectsIcon from '$lib/assets/exploreprojects.svg'
	import Button from '$lib/components/Button.svelte'
	import ProjectList from '$lib/components/ProjectList.svelte'
	import { m } from '$lib/paraglide/messages'
	import { getPfpPath } from '$lib/storage-helpers.js'
	import Row from '$lib/components/Row.svelte'
	import Alert from '$lib/components/Alert.svelte'

	let { data } = $props()
	const discussions = data.blogDiscussions ?? []

	const styles = {
		button_normal:
			'inline-flex rounded-xl px-5 py-2 items-center gap-2 text-2xl font-semibold bg-green-100 text-accent',
		button_small:
			'inline-flex rounded-full bg-accent px-4 py-2 min-w-32 sm:min-w-48 items-center justify-center gap-2 font-bold text-white md:hover:min-w-52 transition-all',
		tab: 'cursor-pointer rounded-t-lg border border-neutral-300 bg-neutral-100 px-3 h-8 text-neutral-600 outline-none border-b-0 flex items-center gap-3 data-[state=active]:border-b-transparent data-[state=active]:bg-white data-[state=active]:text-accent-secondary data-[state=active]:h-10 dark:border-neutral-500 dark:bg-neutral-800 dark:text-neutral-300 dark:data-[state=active]:bg-neutral-700 dark:data-[state=active]:text-white',
		card: 'flex flex-col gap-2 rounded-xl border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-accent h-50 justify-center',
	}
</script>

<svelte:head>
	<title>{data.user ? 'Front Page - AmpMod' : 'AmpMod - Block-based programming. amplified'}</title>
</svelte:head>

<Alert
	id="aw3"
	background="#49b049"
	button={{
		url: 'https://ampmod.flarum.cloud/t/suggestions',
		text: 'Share feedback on forums',
	}}
	icon={Globe}
>
	Welcome to the brand-new AmpMod website! This site is currently in beta and might have bugs.
</Alert>
{#if data.user && !data.user.scratchUsername}
	<Alert
		id="linkScratch"
		background="#855cd6"
		button={{
			url: '/settings/link-scratch',
			text: 'Link now',
		}}
		icon={Link}
	>
		Import your Scratch projects by linking your account.
	</Alert>
{/if}

{#if !data.user}
	<div class="relative bg-accent p-9 text-white">
		<div class="m-auto flex max-w-6xl items-center justify-between">
			<div class="flex grow flex-col justify-center text-left">
				<h1 class="text-4xl leading-tight font-semibold">
					Block-based programming.<br />Amplified.
				</h1>
				<div class="mt-4 flex gap-6">
					<a href="/projects/editor" class={styles.button_normal}><Clapperboard /> Make a project</a
					>
					<a href="/auth/register" class={styles.button_normal}><Sparkles /> Join</a>
				</div>
			</div>
			<div class="hidden items-center justify-center lg:flex">
				<img src={HeroImg} alt="Mascot" class="h-38 w-full object-fill" />
			</div>
		</div>
	</div>
	<div
		class="bg-accent-light/30 p-4 text-accent-secondary not-sm:pt-10 dark:bg-accent-tertiary/80 dark:text-white"
	>
		<div class="flex justify-center gap-4">
			<a href="https://ampmod.codeberg.page/manual" class={styles.button_small}>Manual</a>
			<a href="/about" class={styles.button_small}>About AmpMod</a>
			<a href="/projects/explore" class={styles.button_small}>Explore Projects</a>
		</div>
	</div>
{/if}

<div class="m-auto flex min-h-80 max-w-6xl gap-3 p-8">
	<div class="flex grow basis-0 flex-col items-center justify-center gap-3 text-center">
		{#if data.user}
			<img
				src={getPfpPath(data.user)['64']}
				alt="Your user icon"
				height={72}
				width={72}
				class="h-18 w-18 rounded-lg border border-neutral-500/20 object-cover"
			/>
			<h1 class="text-2xl font-bold">Hello, {data.user.username}!</h1>
			<div class="flex items-center justify-center gap-1">
				<Button href="/projects/editor" data-sveltekit-reload>{m.createProject()}</Button>
				<Button href={`/users/${data.user.username}`}>{m.myProfile()}</Button>
				<Button href="/mystuff">{m.myStuff()}</Button>
			</div>
		{:else}
			<h1 class="text-2xl font-bold">Welcome!</h1>
			<p class="text-neutral-500 dark:text-neutral-400">
				Join the community to share your projects.
			</p>
		{/if}
	</div>

	<div class="flex grow basis-0 flex-col gap-3">
		<Tabs.Root
			class="flex grow flex-col"
			value={data.user ? (data.user.rank === 0 ? 'welcome' : 'feed') : 'news'}
		>
			<Tabs.List class="flex h-10 items-end gap-2 pl-4">
				{#if data.user}
					{#if data.user.rank === 0}
						<Tabs.Trigger value="welcome" class={styles.tab}><MapIcon />Welcome</Tabs.Trigger>
					{/if}
					<Tabs.Trigger value="feed" class={styles.tab}><Rss />Feed</Tabs.Trigger>
				{/if}
				<Tabs.Trigger value="news" class={styles.tab}><Newspaper />Updates</Tabs.Trigger>
			</Tabs.List>

			{#if data.user}
				<Tabs.Content
					value="welcome"
					class="flex grow flex-col items-center justify-center gap-3 rounded-lg border border-yellow-400/30 bg-yellow-50 p-4 text-center dark:bg-yellow-900/20"
				>
					<h1 class="text-2xl font-bold">Welcome to AmpMod!</h1>
					<div class="grid w-full grid-cols-2 gap-4">
						<a href="/projects/editor" class={styles.card} data-sveltekit-reload>
							<img src={CreateCardIcon} class="h-28 object-contain" alt="Mascot" />
							<span class="font-bold">Make a Project</span>
						</a>
						<a href="/projects/explore" class={styles.card}>
							<img src={ExploreProjectsIcon} class="h-28 object-contain" alt="Explore" />
							<span class="font-bold">Explore</span>
						</a>
					</div>
				</Tabs.Content>

				<Tabs.Content
					value="feed"
					class="h-60 grow rounded-lg border border-neutral-300 bg-neutral-100 p-4 dark:border-neutral-500 dark:bg-neutral-800"
				>
					<p>No activity in your feed yet!</p>
				</Tabs.Content>
			{/if}

			<Tabs.Content
				value="news"
				class="h-60 grow overflow-y-auto rounded-lg border border-neutral-300 bg-white dark:border-neutral-500 dark:bg-neutral-800"
			>
				<div class="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-700">
					{#each discussions as item}
						<a
							href="/blog/{item.id}"
							class="group flex items-start gap-4 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
						>
							<div class="flex flex-col">
								<span
									class="font-bold text-accent-secondary group-hover:underline dark:text-accent-light"
									>{item.title}</span
								>
								<div class="flex items-center gap-2 text-sm text-neutral-500">
									<span>{item.author.username}</span>
									<span>•</span>
									<span>{new Date(item.createdAt).toLocaleDateString()}</span>
								</div>
							</div>
						</a>
					{:else}
						<div class="p-8 text-center text-neutral-500 italic">No updates found.</div>
					{/each}
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>

<div class="m-auto flex max-w-6xl flex-col gap-8 p-8">
	<Row title="Featured Projects" seeMore="/projects/featured">
		<ProjectList projects={data.featuredProjects} />
	</Row>
	{#if data.followedProjects}
		<Row title="Projects by AmpModders you're following">
			<ProjectList projects={data.followedProjects} />
		</Row>
	{/if}
	<Row title="Random {data.categorySection.title} Projects">
		<ProjectList projects={data.categorySection.projects} />
	</Row>
	<Row title="Latest Projects">
		<ProjectList projects={data.latestProjects} />
	</Row>
</div>
