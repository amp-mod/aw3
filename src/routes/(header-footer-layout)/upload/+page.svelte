<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { fade } from 'svelte/transition'
	import { enhance } from '$app/forms'
	import { browser } from '$app/environment'
	import JSZip from 'jszip'
	import Button from '$lib/components/Button.svelte'
	import { Image as ImageIcon, Upload } from '@lucide/svelte'
	import { addToast } from '$lib/toast.svelte'

	let loading = $state(false)
	let isMessageImport = $state(false)
	let error = $state('')
	let hasFile = $state(false)

	let title = $state('')
	let notesAndCredits = $state('')
	let projectJson = $state<any>(null)

	// Thumbnail state
	let thumbnails = $state<{ name: string; url: string; priority: number; mimeType: string }[]>([])
	let selectedThumbnailUrl = $state('')
	let thumbnailType = $state<'project' | 'custom'>('project')

	let fileInput: HTMLInputElement
	let thumbInput: HTMLInputElement
	let handleMessage: (event: MessageEvent) => void

	function getMimeType(extension: string): string {
		const map: Record<string, string> = {
			svg: 'image/svg+xml',
			png: 'image/png',
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
		}
		return map[extension.toLowerCase()] || 'image/png'
	}

	async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
		return new Promise((resolve) => {
			const img = new Image()
			img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
			img.onerror = () => resolve({ width: 0, height: 0 })
			img.src = url
		})
	}

	async function selectProjectThumbnail(thumb: { url: string; name: string; mimeType: string }) {
		selectedThumbnailUrl = thumb.url
		thumbnailType = 'project'

		try {
			const response = await fetch(thumb.url)
			const blob = await response.blob()
			const file = new File([blob], 'thumbnail.webp', { type: thumb.mimeType })

			const dataTransfer = new DataTransfer()
			dataTransfer.items.add(file)
			thumbInput.files = dataTransfer.files
		} catch (e) {
			console.error('Failed to sync thumbnail to input:', e)
		}
	}

	async function extractProjectData(file: File | Blob) {
		try {
			const zip = new JSZip()
			const contents = await zip.loadAsync(file)
			const jsonFile = contents.file('project.json')

			if (!jsonFile) throw new Error('Not a Scratch project')

			const jsonText = await jsonFile.async('string')
			projectJson = JSON.parse(jsonText)

			const foundThumbnails: typeof thumbnails = []

			for (const target of projectJson.targets || []) {
				for (const costume of target.costumes || []) {
					const ext = costume.dataFormat || 'png'
					const fileName = costume.md5ext || `${costume.assetId}.${ext}`
					const assetFile = contents.file(fileName)

					if (assetFile) {
						const mimeType = getMimeType(ext)
						const blob = await assetFile.async('blob')
						const url = URL.createObjectURL(new Blob([blob], { type: mimeType }))

						const { width, height } = await getImageDimensions(url)
						if (width < 200 && height < 200) {
							URL.revokeObjectURL(url)
							continue
						}

						let priority = 0
						const lowerName = costume.name.toLowerCase()
						if (lowerName === 'thumbnail') priority = 100
						else if (lowerName.includes('thumbnail')) priority = 50
						if (costume.rotationCenterX >= 240 && costume.rotationCenterY >= 180) priority += 25
						if (ext === 'svg') priority += 10

						foundThumbnails.push({
							name: costume.name,
							url,
							priority,
							mimeType,
						})
					}
				}
			}

			thumbnails = foundThumbnails.sort((a, b) => b.priority - a.priority)

			if (thumbnails.length > 0) {
				await selectProjectThumbnail(thumbnails[0])
			}
		} catch (err) {
			console.error('Failed to unzip project:', err)
			error = 'Could not parse project file.'
		}
	}

	async function handleFileSelection(file: File | Blob) {
		error = ''
		hasFile = true
		title = file instanceof File ? file.name.replace(/\.[^/.]+$/, '') : 'Imported Project'

		const dataTransfer = new DataTransfer()
		const fileObj =
			file instanceof File ? file : new File([file], 'project.apz', { type: 'application/x-zip' })
		dataTransfer.items.add(fileObj)
		fileInput.files = dataTransfer.files

		await extractProjectData(fileObj)
	}

	function onFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0]
		if (file) handleFileSelection(file)
	}

	function handleCustomThumb(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0]
		if (file) {
			if (thumbnailType === 'custom' && selectedThumbnailUrl)
				URL.revokeObjectURL(selectedThumbnailUrl)
			selectedThumbnailUrl = URL.createObjectURL(file)
			thumbnailType = 'custom'
		}
	}

	onMount(() => {
		const params = new URLSearchParams(window.location.search)
		if (params.get('import_from')) {
			loading = true
			isMessageImport = true
		}

		handleMessage = async (event: MessageEvent) => {
			if (event.data?.type === 'aw3/upload' && event.data.payload instanceof Uint8Array) {
				const blob = new Blob([event.data.payload], { type: 'application/x-zip' })
				await handleFileSelection(blob)
				loading = false
				isMessageImport = false
			}
		}
		window.addEventListener('message', handleMessage)
	})

	onDestroy(() => {
		thumbnails.forEach((t) => URL.revokeObjectURL(t.url))
		if (thumbnailType === 'custom' && selectedThumbnailUrl)
			URL.revokeObjectURL(selectedThumbnailUrl)
		if (browser) window.removeEventListener('message', handleMessage)
	})
</script>

<form
	method="POST"
	enctype="multipart/form-data"
	use:enhance={() => {
		loading = true
		error = ''
		return async ({ update, result }) => {
			loading = false
			await update()
			console.log(result)
			if (!result.success) {
				addToast({ type: 'failure', text: result.data.message })
			}
		}
	}}
	class="m-auto my-16 flex max-w-3xl flex-col gap-6 px-4"
>
	<div
		class="flex flex-col gap-4 rounded border-l-4 border-l-accent bg-neutral-100 p-4 dark:bg-neutral-800"
	>
		<h2 class="text-2xl font-bold">Upload Project</h2>

		{#if error}
			<div class="rounded bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
				{error}
			</div>
		{/if}

		<div class="flex flex-col gap-2">
			<p>On this page you can upload a project to AmpMod.</p>
			<p>
				<b class="block">
					The AmpMod Website does not support programming languages other than Scratch 3.0,
					TurboWarp or AmpMod.
				</b>
			</p>
			<p>
				By uploading you agree to the <a href="/terms" class="link text-accent underline"
					>terms of service</a
				> for AmpMod.
			</p>
			<p>
				Using the online AmpMod editor? Consider simply using the "Upload" button. It will
				screenshot your project for use as a thumbnail.
			</p>
		</div>

		{#if loading && isMessageImport}
			<div
				class="rounded bg-yellow-100 p-3 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
			>
				<p><b>Loading...</b></p>
				<p>Please do not close the AmpMod editor.</p>
			</div>
		{:else}
			<div class="relative flex items-center gap-3">
				<input
					bind:this={fileInput}
					name="projectFile"
					onchange={onFileChange}
					type="file"
					accept=".apz,.sb3"
					required
					class="absolute inset-0 z-10 cursor-pointer opacity-0"
				/>
				<div
					class="flex w-full items-center gap-3 overflow-hidden rounded-lg border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900"
				>
					<div class="bg-accent px-4 py-2 text-sm font-bold text-white">Browse...</div>
					<span class="truncate pr-4 text-sm text-neutral-500 dark:text-neutral-400">
						{fileInput?.files?.[0]?.name ?? 'No file selected'}
					</span>
				</div>
			</div>
		{/if}
	</div>

	{#if hasFile}
		<div
			class="flex flex-col gap-6 rounded border-l-4 border-l-blue-500 bg-neutral-100 p-4 dark:bg-neutral-800"
			transition:fade
		>
			<h3 class="text-xl font-bold text-zinc-800 dark:text-zinc-200">Project Details</h3>

			{#if projectJson?.meta?.platform && projectJson.meta.platform?.name !== 'TurboWarp' && projectJson.meta.platform?.name !== 'AmpMod'}
				<div class="rounded bg-red-500 p-3 text-sm font-bold text-white">
					<p>
						This project was created for
						{#if projectJson.meta.platform.url}
							<a
								href={projectJson.meta.platform.url}
								rel="noreferrer noopener"
								target="_blank"
								class="underline"
							>
								{projectJson.meta.platform.name || '(unknown)'}
							</a>
						{:else}
							{projectJson.meta.platform.name || '(unknown)'}
						{/if}.
					</p>
					<p class="mt-2">
						Incompatible projects are against the Terms of Service. Please test this project in
						AmpMod and ensure it functions exactly as it does in {projectJson.meta.platform?.name ||
							'the origin platform'}
						before uploading.
					</p>
				</div>
			{/if}

			<div class="flex flex-col gap-3">
				<label class="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
					>Thumbnail Selection</label
				>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div
						class="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-black/10 dark:border-neutral-700"
					>
						{#if selectedThumbnailUrl}
							<img src={selectedThumbnailUrl} alt="Preview" class="h-full w-full object-contain" />
						{:else}
							<ImageIcon size={48} class="text-neutral-400" />
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<div
							class="flex max-h-[180px] flex-wrap gap-2 overflow-y-auto rounded border bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
						>
							{#each thumbnails as thumb}
								<button
									type="button"
									onclick={() => selectProjectThumbnail(thumb)}
									class="relative aspect-[4/3] w-16 overflow-hidden rounded border-2 transition-all {selectedThumbnailUrl ===
										thumb.url && thumbnailType === 'project'
										? 'border-accent ring-2 ring-accent/20'
										: 'border-transparent opacity-70 hover:opacity-100'}"
									title={thumb.name}
								>
									<img src={thumb.url} alt={thumb.name} class="h-full w-full object-cover" />
								</button>
							{/each}

							<label
								class="relative flex aspect-[4/3] w-16 cursor-pointer flex-col items-center justify-center overflow-hidden rounded border-2 border-dashed border-neutral-400 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 {thumbnailType ===
								'custom'
									? 'border-accent bg-accent/5'
									: ''}"
							>
								<Upload size={18} class="text-neutral-500" />
								<span class="mt-1 text-[8px] font-bold uppercase">Custom</span>
								<input
									bind:this={thumbInput}
									type="file"
									name="thumbnail"
									accept="image/*"
									class="hidden"
									onchange={handleCustomThumb}
								/>
							</label>
						</div>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<label for="title" class="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
					>Title</label
				>
				<input
					id="title"
					name="title"
					type="text"
					bind:value={title}
					required
					placeholder="Project name here..."
					class="w-full rounded border border-neutral-300 bg-white p-2 text-sm focus:border-accent focus:outline-none dark:border-neutral-600 dark:bg-neutral-900"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label for="notes" class="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
					>Notes and Credits</label
				>
				<textarea
					id="notes"
					name="notes"
					bind:value={notesAndCredits}
					placeholder="How did you make this project? Did you use any assets from others?"
					class="min-h-[120px] w-full rounded border border-neutral-300 bg-white p-2 text-sm focus:border-accent focus:outline-none dark:border-neutral-600 dark:bg-neutral-900"
				></textarea>
			</div>

			<div class="flex justify-end">
				<Button type="submit" disabled={loading}>
					{loading ? 'Uploading...' : 'Upload Project'}
				</Button>
			</div>
		</div>
	{/if}
</form>
