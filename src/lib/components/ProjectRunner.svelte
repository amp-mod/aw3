<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'
	import { Flag, Octagon, Maximize, Minimize, Pause, Play } from '@lucide/svelte'
	import { SecurityManagerImplementation } from '$lib/security-manager.svelte'
	import SecurityUI from './SecurityUI.svelte'
	import type { User } from '$lib/server/db/schema'
	import ampmodLogo from '$lib/assets/logo.svg'

	let {
		project,
		extensions = $bindable([]),
		isEmbed = false,
		user,
	} = $props<{
		project: any
		extensions: ExtensionMetadata[]
		user: User
		isEmbed: boolean
	}>()

	let progress = $state('Loading project...')
	let progressNumber = $state(0)
	let container: HTMLDivElement | undefined = $state()
	let rootElement: HTMLDivElement | undefined = $state()
	let scaffolding: any = null
	let isLoading = $state(true)
	let isStarted = $state(false)
	let isRunning = $state(false)
	let isFullscreen = $state(false)
	let isPaused = $state(false)
	const PauseButtonIcon = $derived(isPaused ? Play : Pause)

	// Only track height; width stays 100% via CSS
	let playerHeight = $state(0)

	function handleExtensionAdded(categoryInfo: any) {
		if (!categoryInfo || !categoryInfo.id || categoryInfo.id === 'pen') return
		if (extensions.some((ext) => ext.id === categoryInfo.id)) return
		extensions = [
			...extensions,
			{
				id: categoryInfo.id,
				name: categoryInfo.name || categoryInfo.id,
				icon: categoryInfo.blockIconURI || categoryInfo.menuIconURI || null,
				color1: categoryInfo.color1 || null,
				color2: categoryInfo.color2 || null,
			},
		]
	}

	function syncScaling() {
		if (!rootElement || !container) return
		const isFS = isEmbed || !!document.fullscreenElement
		const canvas = container.querySelector('.sc-canvas') as HTMLCanvasElement

		// Use canvas ratio or default to 4:3
		const ratio = canvas ? canvas.width / canvas.height : 4 / 3

		if (isFS) {
			const screenRatio = window.innerWidth / window.innerHeight
			playerHeight = ratio > screenRatio ? window.innerWidth / ratio : window.innerHeight
		} else {
			// FIX: Measure the parent's width, but ensure the parent has a constrained max-width
			// or measure a reference element that doesn't grow based on this playerHeight.
			const rect = rootElement.getBoundingClientRect()
			playerHeight = rect.width / ratio
		}

		if (scaffolding) scaffolding.relayout()
	}

	onMount(async () => {
		syncScaling()
		window.process = { env: { AMPMOD_VERSION: 'aw3' } }

		try {
			if (!window.Scaffolding) await import('$lib/vendor/scaffolding-min')

			scaffolding = new window.Scaffolding.Scaffolding()
			scaffolding.usePackagedRuntime = true
			scaffolding.setup()
			scaffolding.setUsername(user?.username || '')
			scaffolding.appendTo(container)

			const vm = scaffolding.vm
			window.vm = vm

			scaffolding.storage.addWebStore(
				[
					scaffolding.storage.AssetType.ImageVector,
					scaffolding.storage.AssetType.ImageBitmap,
					scaffolding.storage.AssetType.Sound,
					scaffolding.storage.AssetType.Font,
				],
				(asset: any) =>
					`${location.origin}/uploads/projects/${project.id}/${asset.assetId}.${asset.dataFormat}`,
			)

			vm.on('ASSET_PROGRESS', (finished: number, total: number) => {
				progress = `Loading assets: ${finished} / ${total}`
				progressNumber = finished / total
			})

			Object.assign(vm.extensionManager.securityManager, SecurityManagerImplementation)
			vm.on('EXTENSION_ADDED', handleExtensionAdded)
			await scaffolding.loadProject(project.json)

			isLoading = false
			vm.runtime.on('PROJECT_RUN_START', () => (isRunning = true))
			vm.runtime.on('PROJECT_RUN_STOP', () => (isRunning = false))
			vm.runtime.on('RUNTIME_PAUSED', () => (isPaused = true))
			vm.runtime.on('RUNTIME_UNPAUSED', () => (isPaused = false))

			if (!isEmbed) {
				const scalingInterval = setInterval(syncScaling, 100)
			}
			const fsChange = () => (isFullscreen = !!document.fullscreenElement)
			document.addEventListener('fullscreenchange', fsChange)

			return () => {
				clearInterval(scalingInterval)
				document.removeEventListener('fullscreenchange', fsChange)
			}
		} catch (e) {
			console.error(e)
			progress = e.message
		}
	})

	function startProject() {
		scaffolding?.vm?.start()
		scaffolding?.vm?.greenFlag()
		isStarted = true
	}
	function stopAll() {
		scaffolding?.vm?.stopAll()
	}
	function togglePause() {
		if (scaffolding?.vm) scaffolding.vm.runtime.isPaused = !scaffolding.vm.runtime.isPaused
	}
	function toggleFullscreen() {
		if (!rootElement) return
		!document.fullscreenElement ? rootElement.requestFullscreen() : document.exitFullscreen()
	}
</script>

<SecurityUI />

<div
	bind:this={rootElement}
	class="player-root fullscreen:bg-black relative flex h-full w-full flex-col overflow-hidden"
>
	<div class="flex w-full items-center justify-between px-2 py-1">
		<div class="flex items-center gap-1">
			<button
				class="cursor-pointer rounded p-2 {isRunning ? 'bg-[#59C059]/20' : 'hover:bg-[#59C059]/5'}"
				onclick={startProject}
				title="Go"
			>
				<Flag size={24} fill="#4cbf56" color="#509f48" strokeWidth={1.5} />
			</button>
			<button
				onclick={togglePause}
				class="cursor-pointer rounded p-2 hover:bg-[#59C059]/5"
				title={isPaused ? 'Play' : 'Pause'}
			>
				<PauseButtonIcon size={24} fill="#faa900" color="#d89400" strokeWidth={1.5} />
			</button>
			<button
				onclick={stopAll}
				class="cursor-pointer rounded p-2 hover:bg-[#59C059]/5 {!isRunning ? 'opacity-60' : ''}"
				title="Stop"
			>
				<Octagon size={24} fill="#ff4c4c" color="#d94040" strokeWidth={1.5} />
			</button>
		</div>
		<div class="flex items-center gap-1">
			{#if isEmbed}
				<a
					class="px-3 opacity-80"
					href="/projects/{project.id}?utm_source=aw3embed"
					target="_blank"
				>
					<img src={ampmodLogo} class="h-6" alt="AmpMod" />
				</a>
			{/if}
			<button
				class="cursor-pointer rounded border border-neutral-500/40 p-2 text-zinc-600 dark:text-zinc-400"
				onclick={toggleFullscreen}
				title="Toggle fullscreen"
			>
				{#if isFullscreen}<Minimize size={20} />{:else}<Maximize size={20} />{/if}
			</button>
		</div>
	</div>

	<div
		class="relative w-full overflow-hidden rounded border border-black/10 dark:border-white/10"
		style={`height: ${playerHeight || 'auto'}px; ${!playerHeight && 'aspect-ratio: 4/3;'}`}
	>
		{#if isLoading}
			<div
				class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-accent text-white"
			>
				<h2 class="text-2xl font-bold">Loading Project</h2>
				<div class="text-lg">{progress}</div>
				<div class="h-3 w-70 border border-white">
					<div class="h-full bg-white" style="width: {progressNumber * 100}%;"></div>
				</div>
			</div>
		{/if}
		{#if !isStarted && !isLoading}
			<button
				class="absolute inset-0 z-20 flex cursor-pointer items-center justify-center bg-black/40"
				onclick={startProject}
				title="Click to start the project"
			>
				<div
					class="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-white/80"
				>
					<Flag fill="#4cbf56" color="#469a3f" size={52} strokeWidth={1} />
				</div>
			</button>
		{/if}
		<div bind:this={container} class="z-10 h-full w-full outline-none"></div>
	</div>
</div>
