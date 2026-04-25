<script lang="ts">
	import { onMount } from 'svelte'
	import { Flag, Octagon, Maximize, Minimize, Pause, Play, ShieldAlert } from '@lucide/svelte'
	import { SecurityManagerImplementation } from '$lib/security-manager.svelte'
	import SecurityUI from './SecurityUI.svelte'
	import { type User } from '$lib/server/db/schema'
	import ampmodLogo from '$lib/assets/logo.svg'
	import Button from '$lib/components/Button.svelte'
	import { fade } from 'svelte/transition'

	let {
		project,
		projectJson = null,
		extensions = $bindable([]),
		isEmbed = false,
		user,
		flashingLights = false,
	} = $props<{
		project: any
		projectJson: any
		extensions: any
		user: User
		isEmbed: boolean
		flashingLights: boolean
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
	let isBlockedBySafety = $state(false)

	// Control States
	let isTouchOriented = $state(false)
	let controlMode = $state<'gamepad' | 'keyboard'>('gamepad')
	let playerHeight = $state(0)
	const PauseButtonIcon = $derived(isPaused ? Play : Pause)

	function setKeyState(key: string, isDown: boolean) {
		if (!scaffolding?.vm) return
		scaffolding.vm.postIOData('keyboard', { key, isDown })
	}

	const handleKey = (key: string, isDown: boolean) => (e: PointerEvent) => {
		if (e.cancelable) e.preventDefault()
		setKeyState(key, isDown)
	}

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
		const ratio = canvas ? canvas.width / canvas.height : 4 / 3
		if (isFS) {
			const screenRatio = window.innerWidth / window.innerHeight
			playerHeight = ratio > screenRatio ? window.innerWidth / ratio : window.innerHeight
		} else {
			const rect = rootElement.getBoundingClientRect()
			playerHeight = rect.width / ratio
		}
		if (scaffolding) scaffolding.relayout()
	}

	onMount(async () => {
		isTouchOriented = window.matchMedia('(pointer: coarse)').matches
		const blockDangerous = localStorage.getItem('BlockDangerous') === 'true'
		if (flashingLights && blockDangerous) {
			isBlockedBySafety = true
			isLoading = false
			return
		}

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
			vm.on('ASSET_PROGRESS', (f: number, t: number) => {
				progress = `Loading assets: ${f} / ${t}`
				progressNumber = f / t
			})
			Object.assign(vm.extensionManager.securityManager, SecurityManagerImplementation)
			vm.on('EXTENSION_ADDED', handleExtensionAdded)
			await scaffolding.loadProject(projectJson || project.json)
			isLoading = false
			vm.runtime.on('PROJECT_RUN_START', () => (isRunning = true))
			vm.runtime.on('PROJECT_RUN_STOP', () => (isRunning = false))
			vm.runtime.on('RUNTIME_PAUSED', () => (isPaused = true))
			vm.runtime.on('RUNTIME_UNPAUSED', () => (isPaused = false))

			let scalingInterval = !isEmbed ? setInterval(syncScaling, 100) : null
			const fsChange = () => (isFullscreen = !!document.fullscreenElement)
			document.addEventListener('fullscreenchange', fsChange)
			return () => {
				if (scalingInterval) clearInterval(scalingInterval)
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

	const kbRows = [
		['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
		['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
		['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
		['z', 'x', 'c', 'v', 'b', 'n', 'm'],
	]
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
					class="flex h-9 cursor-pointer items-center gap-2 rounded bg-accent p-2 leading-tight font-bold text-white"
					href="/projects/{project.id}?utm_source=aw3embed"
					target="_blank"
				>
					View on <img src={ampmodLogo} class="h-6" alt="AmpMod" />
				</a>
			{/if}
			<button
				class="h-9 cursor-pointer rounded border border-neutral-500/40 p-2 text-zinc-600 dark:text-zinc-400"
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
		{#if isBlockedBySafety}
			<div
				class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black p-8 text-center text-white"
				in:fade
			>
				<ShieldAlert size={48} class="text-red-500" />
				<p class="max-w-md text-zinc-400">
					This project contains flashing lights. Your safety settings are set to block dangerous
					content.
				</p>
			</div>
		{/if}

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

		{#if !isStarted && !isLoading && !isBlockedBySafety}
			<button
				class="absolute inset-0 z-20 flex cursor-pointer items-center justify-center bg-black/40"
				onclick={startProject}
			>
				<div class="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2">
					{#if isEmbed}<p
							class="pointer-events-auto bg-accent p-2 text-left font-sans text-2xl leading-tight font-bold text-white"
						>
							{project.title}
						</p>{/if}
					{#if flashingLights}<p
							class="pointer-events-auto m-2 rounded-lg border border-red-900 bg-red-600 p-2 text-center font-sans text-2xl leading-tight font-bold text-white"
						>
							This project contains flashing lights.
						</p>{/if}
				</div>
				<div
					class="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-white/80"
				>
					<Flag fill="#4cbf56" color="#469a3f" size={52} strokeWidth={1} />
				</div>
			</button>
		{/if}
		<div bind:this={container} class="z-10 h-full w-full outline-none"></div>
	</div>

	{#if isTouchOriented && isStarted}
		<div
			class="flex w-full touch-none flex-col gap-4 border-t border-black/10 bg-white/5 p-4 select-none dark:border-white/10"
			in:fade
		>
			<div class="flex items-center justify-between">
				<button
					onclick={() => (controlMode = controlMode === 'gamepad' ? 'keyboard' : 'gamepad')}
					class="rounded bg-neutral-500/20 px-3 py-1 text-xs font-bold tracking-wider text-zinc-500 uppercase"
				>
					{controlMode} mode
				</button>
				<div class="flex gap-2">
					<button
						class="rounded bg-red-700 px-4 py-1.5 text-sm font-bold text-white active:scale-95"
						onpointerdown={handleKey('Escape', true)}
						onpointerup={handleKey('Escape', false)}>Esc</button
					>
					<button
						class="rounded bg-accent px-4 py-1.5 text-sm font-bold text-white active:scale-95"
						onpointerdown={handleKey('Enter', true)}
						onpointerup={handleKey('Enter', false)}>Enter</button
					>
				</div>
			</div>

			<div class="flex h-44 items-center justify-center">
				{#if controlMode === 'gamepad'}
					<div class="grid w-full grid-cols-2 items-center">
						<div class="relative mx-auto grid h-36 w-36 grid-cols-3 grid-rows-3 gap-1">
							<div class="col-start-2">
								<button
									class="h-11 w-11 rounded-t-lg bg-neutral-500/20 active:bg-accent"
									onpointerdown={handleKey('ArrowUp', true)}
									onpointerup={handleKey('ArrowUp', false)}>▲</button
								>
							</div>
							<div class="col-start-1 row-start-2">
								<button
									class="h-11 w-11 rounded-l-lg bg-neutral-500/20 active:bg-accent"
									onpointerdown={handleKey('ArrowLeft', true)}
									onpointerup={handleKey('ArrowLeft', false)}>◀</button
								>
							</div>
							<div class="col-start-2 row-start-2 flex items-center justify-center">
								<div class="h-4 w-4 rounded-full bg-neutral-500/20"></div>
							</div>
							<div class="col-start-3 row-start-2">
								<button
									class="h-11 w-11 rounded-r-lg bg-neutral-500/20 active:bg-accent"
									onpointerdown={handleKey('ArrowRight', true)}
									onpointerup={handleKey('ArrowRight', false)}>▶</button
								>
							</div>
							<div class="col-start-2 row-start-3">
								<button
									class="h-11 w-11 rounded-b-lg bg-neutral-500/20 active:bg-accent"
									onpointerdown={handleKey('ArrowDown', true)}
									onpointerup={handleKey('ArrowDown', false)}>▼</button
								>
							</div>
						</div>

						<div class="flex justify-center gap-4">
							<button
								class="h-24 w-24 rounded-full bg-accent text-xl font-bold text-white shadow-lg active:scale-90"
								onpointerdown={handleKey(' ', true)}
								onpointerup={handleKey(' ', false)}>Space</button
							>
							<div class="flex flex-col gap-2">
								<button
									class="h-11 w-11 rounded-full bg-red-900 text-lg font-bold text-white active:scale-90"
									onpointerdown={handleKey('x', true)}
									onpointerup={handleKey('x', false)}>X</button
								>
								<button
									class="h-11 w-11 rounded-full bg-blue-900 text-lg font-bold text-white active:scale-90"
									onpointerdown={handleKey('z', true)}
									onpointerup={handleKey('z', false)}>Z</button
								>
							</div>
						</div>
					</div>
				{:else}
					<div class="flex w-full flex-col items-center gap-1.5">
						{#each kbRows as row}
							<div class="flex gap-1">
								{#each row as key}
									<button
										class="flex h-9 w-8 items-center justify-center rounded bg-neutral-500/10 text-xs font-bold text-zinc-500 uppercase active:bg-neutral-500/30"
										onpointerdown={handleKey(key, true)}
										onpointerup={handleKey(key, false)}>{key}</button
									>
								{/each}
							</div>
						{/each}
						<div class="mt-2 flex items-end gap-6">
							<button
								class="h-10 w-36 rounded bg-accent font-bold text-white shadow-md active:scale-95"
								onpointerdown={handleKey(' ', true)}
								onpointerup={handleKey(' ', false)}>Space</button
							>
							<div class="grid grid-cols-3 gap-0.5">
								<button
									class="col-start-2 h-8 w-9 rounded-t bg-neutral-500/10 text-xs text-zinc-500 active:bg-accent active:text-white"
									onpointerdown={handleKey('ArrowUp', true)}
									onpointerup={handleKey('ArrowUp', false)}>▲</button
								>
								<button
									class="h-8 w-9 rounded-l bg-neutral-500/10 text-xs text-zinc-500 active:bg-accent active:text-white"
									onpointerdown={handleKey('ArrowLeft', true)}
									onpointerup={handleKey('ArrowLeft', false)}>◀</button
								>
								<button
									class="h-8 w-9 bg-neutral-500/10 text-xs text-zinc-500 active:bg-accent active:text-white"
									onpointerdown={handleKey('ArrowDown', true)}
									onpointerup={handleKey('ArrowDown', false)}>▼</button
								>
								<button
									class="h-8 w-9 rounded-r bg-neutral-500/10 text-xs text-zinc-500 active:bg-accent active:text-white"
									onpointerdown={handleKey('ArrowRight', true)}
									onpointerup={handleKey('ArrowRight', false)}>▶</button
								>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
