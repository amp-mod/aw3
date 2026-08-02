<script lang="ts">
	import { onMount } from 'svelte'
	import {
		Flag,
		Octagon,
		Maximize,
		Minimize,
		Pause,
		Play,
		ShieldAlert,
		ChevronUp,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
	} from '@lucide/svelte'
	import { SecurityManagerImplementation } from '$lib/security-manager.svelte'
	import SecurityUI from './SecurityUI.svelte'
	import { type User } from '$lib/server/db/schema'
	import ampmodLogo from '$lib/assets/logo.svg'
	import { fade, slide } from 'svelte/transition'

	let {
		project,
		projectJson = null,
		extensions = $bindable([]),
		isEmbed = false,
		user = null,
	} = $props<{
		project: any
		projectJson?: any
		extensions?: any
		user?: User
		isEmbed?: boolean
	}>()

	let progress = $state('Loading project...')
	let progressNumber = $state(0)
	let iframeElement: HTMLIFrameElement | undefined = $state()
	let rootElement: HTMLDivElement | undefined = $state()
	let scaffolding: any = $state(null)
	let isLoading = $state(true)
	let isStarted = $state(false)
	let isRunning = $state(false)
	let isFullscreen = $state(false)
	let isPaused = $state(false)
	let isBlockedBySafety = $state(false)

	// Control States
	let isTouchOriented = $state(false)
	let isCollapsed = $state(true)
	let controlMode = $state<'gamepad' | 'keyboard'>('gamepad')
	let secondaryControlMode = $state<'space' | '4-button'>('space')
	let playerHeight = $state(0)
	const PauseButtonIcon = $derived(isPaused ? Play : Pause)

	// Joystick 8-Way Logic
	let joystickPos = $state({ x: 0, y: 0 })
	let isDragging = $state(false)
	let activeKeys = $state(new Set<string>())
	const joystickRadius = 65

	function setKeyState(key: string, isDown: boolean) {
		if (!scaffolding?.vm) return
		scaffolding.vm.postIOData('keyboard', { key, isDown })
	}

	const handleKey = (key: string, isDown: boolean) => (e: PointerEvent) => {
		if (e.cancelable) e.preventDefault()
		setKeyState(key, isDown)
	}

	function updateJoystick(clientX: number, clientY: number, rect: DOMRect) {
		const centerX = rect.left + rect.width / 2
		const centerY = rect.top + rect.height / 2
		let dx = clientX - centerX
		let dy = clientY - centerY

		const distance = Math.sqrt(dx * dx + dy * dy)
		if (distance < 15) {
			joystickPos = { x: 0, y: 0 }
			clearActiveKeys()
			return
		}

		const angle = Math.atan2(dy, dx)
		const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
		const visualDist = Math.min(distance, joystickRadius)

		joystickPos = {
			x: Math.cos(snappedAngle) * visualDist,
			y: Math.sin(snappedAngle) * visualDist,
		}

		const newKeys = new Set<string>()
		const deg = (snappedAngle * 180) / Math.PI

		if (deg > -112.5 && deg < -67.5) {
			newKeys.add('ArrowUp')
		} else if (deg >= -67.5 && deg <= -22.5) {
			newKeys.add('ArrowUp')
			newKeys.add('ArrowRight')
		} else if (deg > -22.5 && deg < 22.5) {
			newKeys.add('ArrowRight')
		} else if (deg >= 22.5 && deg <= 67.5) {
			newKeys.add('ArrowDown')
			newKeys.add('ArrowRight')
		} else if (deg > 67.5 && deg < 112.5) {
			newKeys.add('ArrowDown')
		} else if (deg >= 112.5 && deg <= 157.5) {
			newKeys.add('ArrowDown')
			newKeys.add('ArrowLeft')
		} else if (deg > 157.5 || deg < -157.5) {
			newKeys.add('ArrowLeft')
		} else if (deg >= -157.5 && deg <= -112.5) {
			newKeys.add('ArrowUp')
			newKeys.add('ArrowLeft')
		}

		activeKeys.forEach((k) => {
			if (!newKeys.has(k)) setKeyState(k, false)
		})
		newKeys.forEach((k) => {
			if (!activeKeys.has(k)) setKeyState(k, true)
		})
		activeKeys = newKeys
	}

	function clearActiveKeys() {
		activeKeys.forEach((k) => setKeyState(k, false))
		activeKeys.clear()
	}

	function handleJoystickStart(e: PointerEvent) {
		;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
		isDragging = true
		updateJoystick(e.clientX, e.clientY, (e.currentTarget as HTMLElement).getBoundingClientRect())
	}

	function handleJoystickMove(e: PointerEvent) {
		if (!isDragging) return
		updateJoystick(e.clientX, e.clientY, (e.currentTarget as HTMLElement).getBoundingClientRect())
	}

	function handleJoystickEnd() {
		isDragging = false
		joystickPos = { x: 0, y: 0 }
		clearActiveKeys()
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
		if (!rootElement || !iframeElement) return
		const isFS = isEmbed || !!document.fullscreenElement
		const iframeDoc = iframeElement.contentDocument
		const canvas = iframeDoc?.querySelector('.sc-canvas') as HTMLCanvasElement
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

		syncScaling()

		try {
			const iframeWin = iframeElement?.contentWindow
			const iframeDoc = iframeElement?.contentDocument
			if (!iframeWin || !iframeDoc) throw new Error('Iframe not ready')

			// Define environment inside iframe
			iframeWin.process = { env: { AMPMOD_VERSION: 'aw3' } }

			// Inject the script into the iframe
			const script = iframeDoc.createElement('script')
			script.src = '/scaffolding-min.js'

			await new Promise((resolve, reject) => {
				script.onload = resolve
				script.onerror = reject
				iframeDoc.head.appendChild(script)
			})

			// Setup Iframe styling
			const style = iframeDoc.createElement('style')
			style.textContent = `
                body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
                .sc-canvas { width: 100%; height: 100%; display: block; }
            `
			iframeDoc.head.appendChild(style)

			const iframeContainer = iframeDoc.createElement('div')
			iframeContainer.style.width = '100%'
			iframeContainer.style.height = '100%'
			iframeDoc.body.appendChild(iframeContainer)

			// Access constructor from the IFRAME window
			const IframeScaffolding = (iframeWin as any).Scaffolding.Scaffolding

			scaffolding = new IframeScaffolding()
			scaffolding.usePackagedRuntime = true
			scaffolding.setup()
			scaffolding.setUsername(user?.username || '')
			scaffolding.appendTo(iframeContainer)

			const vm = scaffolding.vm
			window.vm = vm
			console.log(
				'Globals: Access the VM by typing vm. To see compiled code, type vm.enableDebug().',
			)

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

	const startProject = () => {
		scaffolding?.vm?.start()
		scaffolding?.vm?.greenFlag()
		isStarted = true
	}
	const stopAll = () => scaffolding?.vm?.stopAll()
	const togglePause = () => {
		if (scaffolding?.vm) scaffolding.vm.runtime.isPaused = !scaffolding.vm.runtime.isPaused
	}
	const toggleFullscreen = () =>
		!document.fullscreenElement ? rootElement?.requestFullscreen() : document.exitFullscreen()

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
	class="player-root fullscreen:bg-black fullscreen:pt-safe relative flex h-full w-full flex-col overflow-hidden"
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
			{#if isEmbed}<a
					class="flex h-9 cursor-pointer items-center gap-2 rounded bg-accent p-2 leading-tight font-bold text-white"
					href="/projects/{project.id}"
					target="_blank">View on <img src={ampmodLogo} class="h-6" alt="AmpMod" /></a
				>{/if}
			<button
				class="h-9 cursor-pointer rounded border border-neutral-500/40 p-2 text-zinc-400"
				onclick={toggleFullscreen}
				>{#if isFullscreen}<Minimize size={20} />{:else}<Maximize size={20} />{/if}</button
			>
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
				class="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center bg-black/40"
				onclick={startProject}
			>
				<div class="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2">
					{#if isEmbed}<p
							class="pointer-events-auto bg-accent p-2 text-left font-sans text-2xl font-bold text-white"
						>
							{project.title}
						</p>{/if}
				</div>
				<div
					class="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-white/80"
				>
					<Flag fill="#4cbf56" color="#469a3f" size={52} strokeWidth={1} />
				</div>
			</button>
		{/if}
		<iframe
			bind:this={iframeElement}
			class="z-10 h-full w-full border-none outline-none"
			sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads allow-pointer-lock"
			title="Project"
		></iframe>
	</div>

	{#if isTouchOriented && isStarted}
		<div
			class="pb-safe flex w-full touch-none flex-col gap-4 p-4 select-none {isFullscreen
				? 'fixed right-0 bottom-0 left-0 z-[9999] border-t border-white/10 bg-black/95 shadow-2xl'
				: 'relative border-t border-black/10 bg-white/5 dark:border-white/10'}"
			in:fade
		>
			<div class="mx-auto flex w-full max-w-screen-xl justify-between">
				<div class="flex gap-2">
					<button
						onclick={() => (controlMode = controlMode === 'gamepad' ? 'keyboard' : 'gamepad')}
						class="rounded bg-neutral-500/20 px-3 py-1 text-xs font-bold uppercase"
						>{controlMode}</button
					>
					{#if controlMode === 'gamepad'}<button
							onclick={() =>
								(secondaryControlMode = secondaryControlMode === 'space' ? '4-button' : 'space')}
							class="rounded bg-neutral-500/20 px-3 py-1 text-xs font-bold text-accent uppercase"
							>{secondaryControlMode}</button
						>{/if}
					{#if !isFullscreen}<button
							onclick={() => (isCollapsed = !isCollapsed)}
							class="rounded bg-accent/20 px-3 py-1 text-xs font-bold text-accent uppercase"
							>{isCollapsed ? 'Show' : 'Hide'}</button
						>{/if}
				</div>
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

			{#if !isCollapsed || isFullscreen}
				<div class="flex min-h-[250px] items-center justify-center" transition:slide>
					<div class="w-full max-w-screen-xl">
						{#if controlMode === 'gamepad'}
							<div class="grid grid-cols-2 items-center">
								<div class="relative mx-auto flex items-center justify-center">
									<div
										class="relative h-44 w-44 touch-none rounded-full border border-white/5 bg-neutral-500/10 shadow-inner"
										onpointerdown={handleJoystickStart}
										onpointermove={handleJoystickMove}
										onpointerup={handleJoystickEnd}
										onpointerleave={handleJoystickEnd}
									>
										<div class="pointer-events-none absolute inset-0 opacity-10">
											<div
												class="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white"
											></div>
											<div class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-white"></div>
											<div class="absolute inset-0 flex rotate-45 items-center justify-center">
												<div class="h-full w-0.5 bg-white"></div>
												<div class="absolute h-0.5 w-full bg-white"></div>
											</div>
										</div>
										<div
											class="pointer-events-none absolute h-20 w-20 rounded-full border-4 border-neutral-400 bg-neutral-300 shadow-xl"
											style="left: 50%; top: 50%; margin-left: -40px; margin-top: -40px; transform: translate3d({joystickPos.x}px, {joystickPos.y}px, 0); transition: {isDragging
												? 'transform 0.08s ease-out'
												: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}"
										>
											<div
												class="h-full w-full rounded-full bg-gradient-to-br from-white/60 to-black/30"
											></div>
										</div>
									</div>
								</div>
								<div class="flex items-center justify-center">
									{#if secondaryControlMode === 'space'}
										<button
											class="h-36 w-36 rounded-full border-4 border-white/10 bg-accent text-2xl font-bold text-white shadow-xl active:scale-90"
											onpointerdown={handleKey(' ', true)}
											onpointerup={handleKey(' ', false)}>SPACE</button
										>
									{:else}
										<div class="relative h-48 w-48">
											<button
												class="absolute top-0 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full border-4 bg-yellow-500 text-xl font-bold text-black active:scale-90"
												onpointerdown={handleKey('s', true)}
												onpointerup={handleKey('s', false)}>S</button
											>
											<button
												class="absolute top-1/2 left-0 h-16 w-16 -translate-y-1/2 rounded-full border-4 bg-blue-600 text-xl font-bold text-white active:scale-90"
												onpointerdown={handleKey('a', true)}
												onpointerup={handleKey('a', false)}>A</button
											>
											<button
												class="absolute top-1/2 right-0 h-16 w-16 -translate-y-1/2 rounded-full border-4 bg-red-600 text-xl font-bold text-white active:scale-90"
												onpointerdown={handleKey('x', true)}
												onpointerup={handleKey('x', false)}>X</button
											>
											<button
												class="absolute bottom-0 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full border-4 bg-green-600 text-xl font-bold text-white active:scale-90"
												onpointerdown={handleKey('z', true)}
												onpointerup={handleKey('z', false)}>Z</button
											>
										</div>
									{/if}
								</div>
							</div>
						{:else}
							<div class="flex flex-col items-center gap-1.5 overflow-x-auto pb-2">
								{#each kbRows as row}
									<div class="flex gap-1">
										{#each row as k}<button
												class="h-9 w-8 rounded bg-white/10 text-[10px] font-bold uppercase active:bg-accent"
												onpointerdown={handleKey(k, true)}
												onpointerup={handleKey(k, false)}>{k}</button
											>{/each}
									</div>
								{/each}
								<div class="mt-2 flex items-end gap-8">
									<button
										class="h-10 w-36 rounded bg-accent font-bold active:scale-95"
										onpointerdown={handleKey(' ', true)}
										onpointerup={handleKey(' ', false)}>Space</button
									>
									<div class="grid grid-cols-3 gap-0.5">
										<button
											class="col-start-2 h-8 w-9 rounded-t bg-white/10"
											onpointerdown={handleKey('ArrowUp', true)}
											onpointerup={handleKey('ArrowUp', false)}><ChevronUp /></button
										>
										<div></div>
										<button
											class="h-8 w-9 rounded-l bg-white/10"
											onpointerdown={handleKey('ArrowLeft', true)}
											onpointerup={handleKey('ArrowLeft', false)}><ChevronLeft /></button
										>
										<button
											class="h-8 w-9 bg-white/10"
											onpointerdown={handleKey('ArrowDown', true)}
											onpointerup={handleKey('ArrowDown', false)}><ChevronDown /></button
										>
										<button
											class="h-8 w-9 rounded-r bg-white/10"
											onpointerdown={handleKey('ArrowRight', true)}
											onpointerup={handleKey('ArrowRight', false)}><ChevronRight /></button
										>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
