<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'
	import { Flag, Octagon, Maximize, Minimize, Pause, Play } from '@lucide/svelte'
	import { SecurityManagerImplementation } from '$lib/security-manager.svelte'
	import SecurityUI from './SecurityUI.svelte'
	import type { User } from '$lib/server/db/schema'
	import { slide } from 'svelte/transition'

	interface ExtensionMetadata {
		id: string
		name: string
		icon: string | null
		color1: string | null
		color2: string | null
	}

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
	let scaffolding: any = null
	let isLoading = $state(true)
	let isStarted = $state(false)
	let isRunning = $state(false)
	let isFullscreen = $state(false)
	let isPaused = $state(false)
	const PauseButtonIcon = $derived(isPaused ? Play : Pause)

	// --- Ported Scaling Logic State ---
	let playerWidth = $state(480)
	let playerHeight = $state(360)
	const FIXED_HEIGHT = 360

	function handleExtensionAdded(categoryInfo: any) {
		if (!categoryInfo || !categoryInfo.id || categoryInfo.id === 'pen') return
		if (extensions.some((ext) => ext.id === categoryInfo.id)) return

		const newExt: ExtensionMetadata = {
			id: categoryInfo.id,
			name: categoryInfo.name || categoryInfo.id,
			icon: categoryInfo.blockIconURI || categoryInfo.menuIconURI || null,
			color1: categoryInfo.color1 || null,
			color2: categoryInfo.color2 || null,
		}
		extensions = [...extensions, newExt]
	}

	function syncScaling() {
		const isFS = isEmbed || !!document.fullscreenElement

		if (!container) return
		const canvas = container.querySelector('canvas') as HTMLCanvasElement
		if (!canvas) {
			if (isFS) {
				// Force 4:3 Fit-to-Window immediately
				const screenRatio = window.innerWidth / window.innerHeight
				const targetRatio = 4 / 3

				if (targetRatio > screenRatio) {
					playerWidth = window.innerWidth
					playerHeight = playerWidth / targetRatio
				} else {
					playerHeight = window.innerHeight
					playerWidth = playerHeight * targetRatio
				}
			} else {
				// Default windowed 4:3
				playerWidth = 480
				playerHeight = 360
			}
			if (scaffolding) scaffolding.relayout()
			return // Exit early to prevent the "jump"
		}
		if (!canvas) return

		const aspectRatio = canvas.width / canvas.height || 4 / 3

		let targetWidth: number
		let targetHeight: number

		if (isFS) {
			// In Fullscreen: Use the actual screen dimensions
			const screenRatio = window.innerWidth / window.innerHeight

			if (aspectRatio > screenRatio) {
				// Project is wider than the screen (letterbox top/bottom)
				targetWidth = window.innerWidth
				targetHeight = targetWidth / aspectRatio
			} else {
				// Project is taller than the screen (pillarbox sides)
				targetHeight = window.innerHeight
				targetWidth = targetHeight * aspectRatio
			}
		} else {
			// In Windowed Mode: Original logic
			if (canvas.height >= canvas.width) {
				targetHeight = FIXED_HEIGHT
				targetWidth = FIXED_HEIGHT * aspectRatio
			} else {
				const padding = 24
				const maxWidth = Math.min(480, window.innerWidth - padding)
				targetWidth = maxWidth
				targetHeight = targetWidth / aspectRatio
			}
		}

		if (Math.abs(playerWidth - targetWidth) > 0.1 || Math.abs(playerHeight - targetHeight) > 0.1) {
			playerWidth = targetWidth
			playerHeight = targetHeight
		}

		if (scaffolding) scaffolding.relayout()
	}

	onMount(async () => {
		syncScaling()
		window.process = { env: { AMPMOD_VERSION: 'aw3' } }
		try {
			if (!window.Scaffolding) {
				await import('$lib/vendor/scaffolding-min')
			}

			scaffolding = new window.Scaffolding.Scaffolding()
			scaffolding.usePackagedRuntime = true
			scaffolding.setup()
			scaffolding.setUsername()
			scaffolding.appendTo(container)

			const storage = scaffolding.storage
			const vm = scaffolding.vm
			window.vm = vm

			storage.addWebStore(
				[
					storage.AssetType.ImageVector,
					storage.AssetType.ImageBitmap,
					storage.AssetType.Sound,
					storage.AssetType.Font,
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

			if (vm.runtime?._blockInfo) {
				for (const category of vm.runtime._blockInfo) {
					handleExtensionAdded(category)
				}
			}

			isLoading = false

			vm.runtime.on('PROJECT_RUN_START', () => (isRunning = true))
			vm.runtime.on('PROJECT_RUN_STOP', () => (isRunning = false))
			vm.runtime.on('RUNTIME_PAUSED', () => (isPaused = true))
			vm.runtime.on('RUNTIME_UNPAUSED', () => (isPaused = false))

			// Ported Interval
			const scalingInterval = setInterval(syncScaling, 100)

			const fsChange = () => (isFullscreen = !!document.fullscreenElement)
			document.addEventListener('fullscreenchange', fsChange)

			return () => {
				clearInterval(scalingInterval)
				document.removeEventListener('fullscreenchange', fsChange)
			}
		} catch (e) {
			console.error('Failed to boot Scaffolding:', e)
			progress = e.message
		}
	})

	onDestroy(() => {
		if (browser && scaffolding) {
			scaffolding.vm.removeListener('EXTENSION_ADDED', handleExtensionAdded)
			location.reload()
		}
	})

	function startProject() {
		if (scaffolding?.vm) {
			scaffolding.vm.start()
			scaffolding.vm.greenFlag()
			isStarted = true
		}
	}

	function stopAll() {
		if (scaffolding?.vm) scaffolding.vm.stopAll()
	}

	function togglePause() {
		if (scaffolding?.vm) scaffolding.vm.runtime.isPaused = !scaffolding.vm.runtime.isPaused
	}

	function toggleFullscreen() {
		const wrapper = container?.closest('.player-root')
		if (!wrapper) return
		if (!document.fullscreenElement) {
			wrapper.requestFullscreen().catch(() => {})
		} else {
			document.exitFullscreen()
		}
	}
</script>

<SecurityUI />
<div class="player-root fullscreen:bg-black relative flex h-full flex-col overflow-hidden">
	<div class="mx-auto flex items-center justify-between px-2 py-1" style="width: {playerWidth}px;">
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
		<button
			class="cursor-pointer rounded border border-neutral-500/40 p-2 text-zinc-600 dark:text-zinc-400"
			onclick={toggleFullscreen}
			title="Toggle fullscreen"
		>
			{#if isFullscreen}<Minimize size={20} />{:else}<Maximize size={20} />{/if}
		</button>
	</div>

	<div
		class="relative mx-auto overflow-hidden rounded border border-black/10 dark:border-white/10"
		style="width: {playerWidth}px; height: {playerHeight}px;"
	>
		{#if isLoading}
			<div
				class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-accent text-white"
			>
				<h2 class="text-2xl font-bold">Loading Project</h2>
				<div class="text-lg">{progress}</div>

				<div class="h-3 w-70 border border-white">
					<div class="h-full bg-white" style={`width: ${progressNumber * 100}%;`}></div>
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
