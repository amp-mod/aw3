<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { fade } from 'svelte/transition'
	import { enhance } from '$app/forms'
	import { browser } from '$app/environment'
	import JSZip from 'jszip'
	import Button from '$lib/components/Button.svelte'
	import { Image as ImageIcon, Upload } from '@lucide/svelte'
	import { addToast } from '$lib/toast.svelte'

	let { data } = $props()

	let loading = $state(false)
	let isMessageImport = $state(false)
	let isScratchImport = $state(false)
	let error = $state('')
	let hasFile = $state(false)

	let title = $state('')
	let notesAndCredits = $state('')
	let projectJson = $state<any>(null)

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
			if (thumbInput) thumbInput.files = dataTransfer.files
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

			if (isZip) {
				const contents = await zip.loadAsync(buffer)
				const jsonFile = contents.file('project.json')
				if (!jsonFile) throw new Error('Not a Scratch project (missing project.json)')
				jsonText = await jsonFile.async('string')
			} else {
				jsonText = new TextDecoder().decode(buffer)
			}

			projectJson = JSON.parse(jsonText)
			const foundThumbnails: typeof thumbnails = []
			const newZip = new JSZip()
			newZip.file('project.json', jsonText)

			for (const target of projectJson.targets || []) {
				const assets = [...(target.costumes || []), ...(target.sounds || [])]
				for (const asset of assets) {
					const ext = asset.dataFormat || (asset.md5ext ? asset.md5ext.split('.').pop() : 'png')
					const fileName = asset.md5ext || `${asset.assetId}.${ext}`

					let assetData: ArrayBuffer

					if (isZip) {
						const contents = await zip.loadAsync(buffer)
						const existingFile = contents.file(fileName)
						if (existingFile) {
							assetData = await existingFile.async('arraybuffer')
						} else {
							const resp = await fetch(
								`https://assets.scratch.mit.edu/internalapi/asset/${fileName}/get/`,
							)
							assetData = resp.ok ? await resp.arrayBuffer() : new ArrayBuffer(0)
						}
					} else {
						const resp = await fetch(
							`https://assets.scratch.mit.edu/internalapi/asset/${fileName}/get/`,
						)
						assetData = resp.ok ? await resp.arrayBuffer() : new ArrayBuffer(0)
					}

					if (assetData.byteLength > 0) {
						newZip.file(fileName, assetData)

						if (target.costumes?.includes(asset)) {
							const mimeType = getMimeType(ext)
							const blob = new Blob([assetData], { type: mimeType })
							const url = URL.createObjectURL(blob)
							const { width, height } = await getImageDimensions(url)

							if (width >= 200 || height >= 200) {
								let priority = asset.name.toLowerCase().includes('thumbnail') ? 100 : 0
								foundThumbnails.push({ name: asset.name, url, priority, mimeType })
							} else {
								URL.revokeObjectURL(url)
							}
						}
					}
				}
			}

			const completeBlob = await newZip.generateAsync({ type: 'blob' })
			const dataTransfer = new DataTransfer()
			dataTransfer.items.add(new File([completeBlob], 'project.sb3', { type: 'application/x-zip' }))
			if (fileInput) fileInput.files = dataTransfer.files

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
		const scratchId = params.get('scratch_id')
		if (scratchId) {
			loading = true
			isScratchImport = true
			try {
				const metaResp = await fetch(`https://trampoline.turbowarp.org/api/projects/${scratchId}`)
				if (!metaResp.ok) throw new Error('Project not shared or not found.')
				const metadata = await metaResp.json()

				if (metadata.author?.username?.toLowerCase() !== data.linkedUsername?.toLowerCase()) {
					throw new Error(`Ownership mismatch. Verified as ${data.linkedUsername}.`)
				}

				title = metadata.title || ''

				// Concatenate Instructions and Notes/Credits
				const instructions = metadata.instructions || ''
				const credits = metadata.description || '' // Scratch API refers to Notes & Credits as "description"
				notesAndCredits = [instructions, credits].filter(Boolean).join('\n\n')

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
				await handleFileSelection(new Blob([buffer]))
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
	use:enhance={() => {
		loading = true
		return async ({ update, result }) => {
			loading = false
			await update()
			if (result.type === 'failure')
				addToast({ type: 'failure', text: result.data?.message ?? 'Upload failed' })
		}
	}}
	class="m-auto my-16 flex max-w-3xl flex-col gap-6 px-4"
>
	<input bind:this={fileInput} name="projectFile" type="file" class="hidden" required />
	<input bind:this={thumbInput} name="thumbnail" type="file" class="hidden" />

	{#if !isScratchImport}
		<div
			class="flex flex-col gap-4 rounded border-l-4 border-l-accent bg-neutral-100 p-4 dark:bg-neutral-800"
		>
			<h2 class="text-2xl font-bold">Upload Project</h2>
			{#if error}<div class="text-sm font-bold text-red-500">{error}</div>{/if}
			<div class="flex flex-col gap-2">
				<p>On this page you can upload a project to AmpMod.</p>
				<p>
					<b
						>The AmpMod Website does not support programming languages other than Scratch 3.0,
						TurboWarp or AmpMod.</b
					>
				</p>
				<p>
					By uploading you agree to the <a href="/terms" class="link text-accent underline"
						>terms of service</a
					>.
				</p>
				<p>
					Using the online AmpMod editor? Consider using the "Upload" button there to
					auto-screenshot a thumbnail.
				</p>
			</div>
			<div class="relative flex items-center gap-3">
				<input
					type="file"
					accept=".apz,.sb3"
					onchange={(e) => handleFileSelection(e.target.files[0])}
					class="absolute inset-0 z-10 cursor-pointer opacity-0"
				/>
				<div
					class="flex w-full items-center gap-3 overflow-hidden rounded-lg border bg-white dark:bg-neutral-900"
				>
					<div class="bg-accent px-4 py-2 font-bold text-white">Browse...</div>
					<span class="truncate p-2 text-sm text-neutral-500"
						>{fileInput?.files?.[0]?.name ?? 'No file selected'}</span
					>
				</div>
			</div>
		</div>
	{/if}

	{#if hasFile}
		<div
			class="flex flex-col gap-6 rounded border-l-4 border-l-blue-500 bg-neutral-100 p-4 dark:bg-neutral-800"
			transition:fade
		>
			<h3 class="text-xl font-bold">Project Details</h3>

			{#if projectJson?.meta?.platform && projectJson.meta.platform?.name !== 'TurboWarp' && projectJson.meta.platform?.name !== 'AmpMod'}
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
								<img src={thumb.url} alt="costume" class="h-full w-full object-cover" />
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
										thumbInput.files = dt.files
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
				<textarea
					id="notes"
					name="notes"
					bind:value={notesAndCredits}
					placeholder="How did you make this? Did you use other assets?"
					class="min-h-[150px] w-full rounded border p-2 outline-none dark:bg-neutral-900"
				></textarea>
			</div>

			<div class="flex justify-end pt-4">
				<Button type="submit" disabled={loading || !isFormValid}>
					{loading ? 'Processing...' : 'Upload Project'}
				</Button>
			</div>
		</div>
	{/if}
</form>
