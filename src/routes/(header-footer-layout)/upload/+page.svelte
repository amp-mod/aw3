<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { fade } from 'svelte/transition'
	import { enhance } from '$app/forms'
	import JSZip from 'jszip'
	import Button from '$lib/components/Button.svelte'
	import { Image as ImageIcon, Upload } from '@lucide/svelte'
	import { addToast } from '$lib/toast.svelte'
	import { goto } from '$app/navigation'
	import Modal from '$lib/components/Modal.svelte'
	import Tiptap from '$lib/components/Tiptap.svelte'

	let { data } = $props()

	let loading = $state(false)
	let isScratchImport = $state(false)
	let scratchId = $state('')
	let error = $state('')
	let hasFile = $state(false)

	let title = $state('')
	let notesAndCredits = $state('')
	let projectJsonText = $state('')
	let projectJson = $state<any>(null)
	let isUploading = $state(false)
	let progress = $state(0)
	let progressText = $state('')

	// Store extracted raw assets for multi-step upload
	let extractedAssets = $state<{ name: string; file: File }[]>([])

	let thumbnails = $state<{ name: string; url: string; priority: number; mimeType: string }[]>([])
	let selectedThumbnailUrl = $state('')
	let thumbnailType = $state<'project' | 'custom'>('project')

	let fileInput: HTMLInputElement
	let thumbInput: HTMLInputElement
	let jsonInput: HTMLInputElement
	let customThumbInput: HTMLInputElement
	let handleMessage: (event: MessageEvent) => void

	function getMimeType(extension: string): string {
		const map: Record<string, string> = {
			svg: 'image/svg+xml',
			png: 'image/png',
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			webp: 'image/webp',
			wav: 'audio/wav',
			mp3: 'audio/mpeg',
		}
		return map[extension.toLowerCase()] || 'application/octet-stream'
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
			if (customThumbInput) customThumbInput.files = dataTransfer.files
		} catch (e) {
			console.error('Failed to sync thumbnail:', e)
		}
	}

	async function extractProjectData(file: File | Blob) {
		try {
			const buffer = await file.arrayBuffer()
			const uint8 = new Uint8Array(buffer)
			const isZip = uint8[0] === 0x50 && uint8[1] === 0x4b

			let zip = new JSZip()
			let jsonText = ''
			let newExtractedAssets: { name: string; file?: File; fetchUrl?: string }[] = []

			if (isZip) {
				const contents = await zip.loadAsync(buffer)
				const jsonFile = contents.file('project.json')
				if (!jsonFile) throw new Error('Not a Scratch project (missing project.json)')
				jsonText = await jsonFile.async('string')
			} else {
				jsonText = new TextDecoder().decode(buffer)
			}

			projectJsonText = jsonText
			projectJson = JSON.parse(jsonText)

			if (jsonInput) {
				const jsonFileObj = new File([jsonText], 'project.json', { type: 'application/json' })
				const dt = new DataTransfer()
				dt.items.add(jsonFileObj)
				jsonInput.files = dt.files
			}

			const foundThumbnails: typeof thumbnails = []

			if (isZip) {
				const contents = await zip.loadAsync(buffer)
				for (const target of projectJson.targets || []) {
					const assets = [...(target.costumes || []), ...(target.sounds || [])]
					for (const asset of assets) {
						const ext = asset.dataFormat || (asset.md5ext ? asset.md5ext.split('.').pop() : 'png')
						const fileName = asset.md5ext || `${asset.assetId}.${ext}`
						const existingFile = contents.file(fileName)

						if (existingFile) {
							const assetData = await existingFile.async('arraybuffer')
							if (assetData.byteLength > 0) {
								const mimeType = getMimeType(ext)
								const assetBlob = new Blob([assetData], { type: mimeType })
								const assetFile = new File([assetBlob], fileName, { type: mimeType })
								newExtractedAssets.push({ name: fileName, file: assetFile })

								if (target.costumes?.includes(asset)) {
									const url = URL.createObjectURL(assetBlob)
									const { width, height } = await getImageDimensions(url)

									if (ext === 'svg' || width >= 200 || height >= 200) {
										let priority = asset.name.toLowerCase().includes('thumbnail') ? 100 : 0
										foundThumbnails.push({ name: asset.name, url, priority, mimeType })
									} else {
										URL.revokeObjectURL(url)
									}
								}
							}
						}
					}
				}
			} else {
				// Non-ZIP / Scratch Import: Just record CDN fetch URLs for lazy loading during upload
				const uniqueAssets = new Map<string, { asset: any; isCostume: boolean }>()

				for (const target of projectJson.targets || []) {
					for (const costume of target.costumes || []) {
						const ext =
							costume.dataFormat || (costume.md5ext ? costume.md5ext.split('.').pop() : 'png')
						const fileName = costume.md5ext || `${costume.assetId}.${ext}`
						if (!uniqueAssets.has(fileName)) {
							uniqueAssets.set(fileName, { asset: costume, isCostume: true })
						}
					}
					for (const sound of target.sounds || []) {
						const ext = sound.dataFormat || (sound.md5ext ? sound.md5ext.split('.').pop() : 'wav')
						const fileName = sound.md5ext || `${sound.assetId}.${ext}`
						if (!uniqueAssets.has(fileName)) {
							uniqueAssets.set(fileName, { asset: sound, isCostume: false })
						}
					}
				}

				for (const [fileName, { asset, isCostume }] of uniqueAssets.entries()) {
					const fetchUrl = `https://assets.scratch.mit.edu/internalapi/asset/${fileName}/get/`
					newExtractedAssets.push({ name: fileName, fetchUrl })

					if (isCostume) {
						const ext = fileName.split('.').pop() || 'png'
						const mimeType = getMimeType(ext)
						let priority = asset.name.toLowerCase().includes('thumbnail') ? 100 : 0
						foundThumbnails.push({ name: asset.name, url: fetchUrl, priority, mimeType })
					}
				}
			}

			extractedAssets = newExtractedAssets

			const uniqueThumbs = [...thumbnails]
			foundThumbnails.forEach((nt) => {
				if (!uniqueThumbs.find((ut) => ut.url === nt.url)) uniqueThumbs.push(nt)
			})
			thumbnails = uniqueThumbs.sort((a, b) => b.priority - a.priority)

			if (!selectedThumbnailUrl && thumbnails.length > 0) {
				await selectProjectThumbnail(thumbnails[0])
			}
		} catch (err: any) {
			error = 'Failed to process project: ' + err.message
			console.error(err)
		}
	}
	async function handleFileSelection(file: File | Blob) {
		error = ''
		hasFile = true
		await extractProjectData(file)
		if (file instanceof File && !title) title = file.name.replace(/\.[^/.]+$/, '')
	}

	onMount(async () => {
		const params = new URLSearchParams(window.location.search)
		scratchId = params.get('scratch_id')
		if (scratchId) {
			loading = true
			isScratchImport = true
			try {
				const metaResp = await fetch(`https://trampoline.turbowarp.org/api/projects/${scratchId}`)
				if (!metaResp.ok) throw new Error('Project not shared or not found.')
				const metadata = await metaResp.json()

				if (metadata.author?.username?.toLowerCase() !== data.linkedUsername?.toLowerCase()) {
					throw new Error('You are not the verified creator of this project.')
				}

				title = metadata.title || ''

				notesAndCredits = ''
				const instructions = metadata.instructions || ''
				const credits = metadata.description || ''

				if (instructions) {
					notesAndCredits += `## Instructions\n${instructions}`
				}

				if (credits) {
					if (notesAndCredits) {
						notesAndCredits += `\n\n`
					}
					notesAndCredits += `## Notes and Credits\n${credits}`
				}

				if (metadata.image) {
					const scratchThumb = {
						name: 'Scratch Thumbnail',
						url: metadata.image,
						priority: 200,
						mimeType: 'image/png',
					}
					thumbnails = [scratchThumb]
					await selectProjectThumbnail(scratchThumb)
				}

				const dataResp = await fetch(
					`https://projects.scratch.mit.edu/${scratchId}?token=${metadata.project_token}`,
				)
				const buffer = await dataResp.arrayBuffer()
				const scratchFile = new File([buffer], `${scratchId}.sb3`, {
					type: 'application/x.scratch.sb3',
				})
				await handleFileSelection(scratchFile)
			} catch (err: any) {
				error = err.message
				addToast({ type: 'failure', text: error })
			} finally {
				loading = false
			}
		}

		handleMessage = async (event: MessageEvent) => {
			if (event.data?.type === 'aw3/upload' && event.data.payload instanceof Uint8Array) {
				await handleFileSelection(new Blob([event.data.payload]))
			}
		}
		window.addEventListener('message', handleMessage)
	})

	onDestroy(() => {
		thumbnails.forEach((t) => {
			if (t.url.startsWith('blob:')) URL.revokeObjectURL(t.url)
		})
	})

	let isFormValid = $derived(title.trim().length > 0 && hasFile)
</script>

<form
	method="POST"
	enctype="multipart/form-data"
	action="?/uploadProjectJson"
	use:enhance={() => {
		loading = true
		progress = 0
		progressText = 'Uploading project data...'
		isUploading = true

		return async ({ result }) => {
			try {
				if (result.type === 'success' && result.data?.success) {
					const projectId = result.data.projectId

					// Upload extracted assets one by one
					const concurrencyLimit = isScratchImport ? 15 : 30
					let assetIndex = 0

					async function uploadWorker() {
						while (assetIndex < extractedAssets.length) {
							const currentIndex = assetIndex++
							const asset = extractedAssets[currentIndex]
							progress = (currentIndex / extractedAssets.length) * 100
							progressText = `Uploading assets (${currentIndex + 1}/${extractedAssets.length})...`

							let fileToUpload = asset.file

							// Fetch from Scratch CDN on-the-fly right before uploading
							if (!fileToUpload && asset.fetchUrl) {
								try {
									const res = await fetch(asset.fetchUrl)
									if (res.ok) {
										const blob = await res.blob()
										const ext = asset.name.split('.').pop() || 'png'
										fileToUpload = new File([blob], asset.name, { type: getMimeType(ext) })
									} else {
										console.error(`Failed to download remote asset: ${asset.name} (${res.status})`)
										continue
									}
								} catch (err) {
									console.error(`Error fetching asset ${asset.name}:`, err)
									continue
								}
							}

							if (!fileToUpload) continue
							const assetResp = await fetch(`/projects/${projectId}/upload/${asset.name}`, {
								method: 'POST',
								body: fileToUpload,
							})

							if (!assetResp.ok) {
								console.error(`Failed to upload asset: ${asset.name}`)
							}
						}
					}
					const workers = Array(Math.min(concurrencyLimit, extractedAssets.length))
						.fill(0)
						.map(() => uploadWorker())

					await Promise.all(workers)
					goto(`/projects/${projectId}`)
				} else if (result.type === 'failure') {
					loading = false
					isUploading = false
					addToast({ type: 'failure', text: result.data?.message ?? 'Upload failed' })
				}
			} catch (err: any) {
				loading = false
				console.error(err)
				addToast({ type: 'failure', text: 'An error occurred uploading project assets.' })
				isUploading = false
			}
		}
	}}
	class="m-auto my-16 flex max-w-3xl flex-col gap-6 px-4"
>
	<input bind:this={jsonInput} name="projectJson" type="file" class="hidden" required />
	<input bind:this={customThumbInput} name="thumbnail" type="file" class="hidden" />
	<input class="hidden" name="scratchProjectID" value={scratchId} />

	<div
		class="flex flex-col gap-4 rounded border-l-4 border-l-accent bg-neutral-100 p-4 dark:bg-neutral-800"
	>
		<h2 class="text-2xl font-bold">Upload Project</h2>
		{#if error}<div class="text-sm font-bold text-red-500">{error}</div>{/if}
		<div class="flex flex-col gap-2">
			<p>On this page you can upload a project to AmpMod.</p>
		</div>
		<div class="relative flex items-center gap-3">
			{#if isScratchImport}
				<p><i>Project loaded from Scratch.</i></p>
			{:else}
				<input
					type="file"
					accept=".apz,.sb3"
					onchange={(e) => {
						if (e.target.files?.[0]) handleFileSelection(e.target.files[0])
					}}
					class="absolute inset-0 z-10 cursor-pointer opacity-0"
				/>
				<div
					class="flex w-full items-center gap-3 overflow-hidden rounded-lg border bg-white dark:bg-neutral-900"
				>
					<div class="bg-accent px-4 py-2 font-bold text-white">Browse...</div>
					<span class="truncate p-2 text-sm text-neutral-500"
						>{jsonInput?.files?.[0]?.name ?? 'No file selected'}</span
					>
				</div>
			{/if}
		</div>
	</div>

	{#if hasFile}
		<div
			class="flex flex-col gap-6 rounded border-l-4 border-l-blue-500 bg-neutral-100 p-4 dark:bg-neutral-800"
			transition:fade
		>
			<h3 class="text-xl font-bold">Project Details</h3>

			{#if projectJson?.meta?.platform && projectJson.meta.platform?.name !== 'TurboWarp' && projectJson.meta.platform?.name !== 'AmpMod' && !isScratchImport}
				<div class="rounded bg-red-500 p-3 text-sm font-bold text-white">
					<p>
						This project was created for {projectJson.meta.platform.name}. Incompatible projects are
						against the TOS. Ensure it functions correctly in AmpMod before uploading.
					</p>
				</div>
			{/if}

			<div class="flex flex-col gap-3">
				<span class="text-sm font-semibold">Thumbnail Selection</span>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div
						class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded border border-neutral-300 bg-black/10 dark:border-neutral-700"
					>
						{#if selectedThumbnailUrl}
							<img src={selectedThumbnailUrl} alt="Preview" class="h-full w-full object-contain" />
						{:else}
							<ImageIcon size={48} class="text-neutral-400" />
						{/if}
					</div>
					<div
						class="flex max-h-[180px] flex-wrap gap-2 overflow-y-auto rounded border bg-white p-2 dark:bg-neutral-900"
					>
						{#each thumbnails as thumb}
							<button
								type="button"
								onclick={() => selectProjectThumbnail(thumb)}
								class="aspect-[4/3] w-16 overflow-hidden rounded border-2 transition-all {selectedThumbnailUrl ===
								thumb.url
									? 'scale-105 border-accent'
									: 'border-transparent opacity-60 hover:opacity-100'}"
							>
								<img
									src={thumb.url}
									alt="costume"
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							</button>
						{/each}
						<label
							class="flex aspect-[4/3] w-16 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed hover:bg-neutral-50 dark:hover:bg-neutral-800 {thumbnailType ===
							'custom'
								? 'border-accent'
								: ''}"
						>
							<Upload size={16} />
							<input
								type="file"
								accept="image/*"
								class="hidden"
								onchange={(e) => {
									if (e.target.files?.[0]) {
										selectedThumbnailUrl = URL.createObjectURL(e.target.files[0])
										thumbnailType = 'custom'
										const dt = new DataTransfer()
										dt.items.add(e.target.files[0])
										customThumbInput.files = dt.files
									}
								}}
							/>
						</label>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<label for="title" class="text-sm font-semibold">Title</label>
				<input
					id="title"
					name="title"
					bind:value={title}
					required
					class="w-full rounded border p-2 outline-none focus:ring-1 focus:ring-accent dark:bg-neutral-900"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label for="notes" class="text-sm font-semibold">Notes and Credits</label>
				<textarea id="notes" name="notes" bind:value={notesAndCredits} hidden></textarea>
				<div class="flex h-96">
					<Tiptap bind:value={notesAndCredits} />
				</div>
			</div>

			<div class="flex justify-end pt-4">
				<Button type="submit" disabled={loading || !isFormValid}>
					{loading ? 'Processing...' : 'Upload Project'}
				</Button>
			</div>
		</div>
	{/if}
</form>

<Modal bind:open={isUploading} title="Uploading Project" canClose={false}>
	<div class="flex flex-col gap-4">
		<div class="flex h-4 w-full items-stretch rounded-full bg-neutral-100 dark:bg-neutral-700">
			<div
				class="h-4 rounded-full bg-accent transition-all dark:bg-accent-light"
				style="width: {progress}%;"
			></div>
		</div>
		<p>{progressText}</p>
	</div>
</Modal>
