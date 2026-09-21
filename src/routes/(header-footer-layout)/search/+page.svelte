<script lang="ts">
	import { page } from '$app/state'
	import { search } from './search.remote'
	import ProjectGrid from '$lib/components/ProjectGrid.svelte'
	import Button from '$lib/components/Button.svelte'
	import { untrack } from 'svelte'
	import { searchState } from '$lib/search.svelte'
	import { addToast } from '$lib/toast.svelte'
	import PFP from '$lib/components/PFP.svelte'

	let pageNum = $state(1)
	let projects = $state([])
	let user = $state(null)
	let exhausted = $state(false)

	// 1. SYNC URL TO STATE
	$effect(() => {
		const urlQuery = page.url.searchParams.get('q') || ''
		if (searchState.query !== urlQuery) {
			searchState.query = urlQuery
		}
	})

	// 2. TRIGGER FETCH
	let query = $derived(
		search({
			page: pageNum,
			search: searchState.query,
		}),
	)

	// 3. RESET & EASTER EGGS
	$effect(() => {
		const currentSearch = searchState.query
		const body = document.body

		untrack(() => {
			pageNum = 1
			projects = []
			user = null
			exhausted = false

			body.classList.remove('barrel-roll', 'retro-1920', 'pisa', 'amp-mirror')

			if (!currentSearch) return

			const term = currentSearch.toLowerCase()

			if (term === 'do a barrel roll' || term === 'z or r twice') {
				body.classList.add('barrel-roll')
				setTimeout(() => body.classList.remove('barrel-roll'), 2000)
			}
			if (term === '1920') body.classList.add('retro-1920')
			if (term === 'leaning tower of pisa') body.classList.add('pisa')
			if (term === 'comic sans' || term === 'bad ux design') {
				body.classList.add('comic-sans')
				addToast({
					text: "Thanks you for you's feedback, but we have decide not change the font from comic sans . ..",
				})
			}
			if (term === 'https://50-scratch-tabs.github.io/ampmirror' || term === '0.2') {
				body.classList.add('amp-mirror')
				addToast({
					text: 'On a serious note please stop using the outdated 50-scratch-tabs mirror',
					type: 'failure',
				})
			}
			if (term === 'zero wing') alert('ALL YOUR BASE ARE BELONG TO US')
		})
	})

	// 4. SYNC RESULTS
	$effect(() => {
		if (query.error || !query.current || query.loading) return

		const newProjects = query.current.projects ?? []
		const currentUser = query.current.user ?? null

		untrack(() => {
			if (pageNum === 1) {
				projects = newProjects
				user = currentUser
			} else {
				const existingProjectIds = new Set(projects.map((p) => p.id))
				const uniqueProjects = newProjects.filter((p) => !existingProjectIds.has(p.id))
				projects = [...projects, ...uniqueProjects]
			}
			exhausted = newProjects.length < 12
		})
	})

	function loadMore() {
		pageNum += 1
	}
</script>

<div class="bg-accent-secondary p-8 text-center text-white">
	<h1 class="text-3xl font-bold">Search</h1>
</div>

<div class="m-auto flex max-w-5xl flex-col gap-8 py-8">
	{#if user}
		<section class="flex flex-col gap-3">
			<a
				href="/users/{user.username}"
				class="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-neutral-300 bg-neutral-50 p-6 shadow-sm transition hover:border-neutral-400 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
			>
				<PFP {user} size={72} />
				<div class="flex flex-1 flex-col text-center sm:text-left">
					<h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
						{user.username}
					</h3>
					<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
						{user.bio}
					</p>
				</div>
			</a>
		</section>
	{/if}

	{#if projects.length > 0}
		<section class="flex flex-col gap-3">
			<ProjectGrid {projects} />
		</section>
	{:else if !query.loading && !query.error && searchState.query && !user}
		<div class="py-20 text-center text-neutral-500">
			<p>No results found</p>
		</div>
	{/if}

	{#if query.error}
		<div class="rounded bg-red-100 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
			Oops! Something went wrong while searching.
		</div>
	{:else if !exhausted && (projects.length > 0 || query.loading)}
		<div class="py-10 text-center">
			<Button onclick={loadMore} disabled={query.loading}>
				{query.loading ? 'Searching...' : 'Load More'}
			</Button>
		</div>
	{/if}
</div>

<style>
	:global(body.barrel-roll) {
		animation: roll 2s ease-in-out forwards;
	}
	:global(body.retro-1920) {
		filter: grayscale(1) sepia(1) !important;
		font-family: serif !important;
		background: #99440010;
	}
	:global(body.pisa) {
		transform: rotate(3deg);
		transform-origin: center top;
	}
	:global(body.amp-mirror) {
		--color-accent: #59c059;
		accent-color: #59c059;
	}
	:global(body.comic-sans) {
		--font-sans: 'Comic Sans MS', cursive, sans-serif !important;
		font-family: 'Comic Sans MS', cursive, sans-serif !important;
	}
	@keyframes roll {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
