<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { fade } from 'svelte/transition'
	import { enhance } from '$app/forms'
	import JSZip from 'jszip'
	import Button from '$lib/components/Button.svelte'

	// Runes for State
	let loading = $state(false)
	let isMessageImport = $state(false)
	let error = $state('')
	let hasFile = $state(false)

	// Form State
	let title = $state('')
	let notesAndCredits = $state('')

	// Store for extracted project data
	let projectJson = $state<object | null>(null)

	let fileInput: HTMLInputElement
	let handleMessage: (event: MessageEvent) => void

	async function extractProjectJson(file: File | Blob) {
		try {
			const zip = new JSZip()
			const contents = await zip.loadAsync(file)
			const jsonFile = contents.file('project.json')

			if (jsonFile) {
				const jsonText = await jsonFile.async('string')
				projectJson = JSON.parse(jsonText)
				console.log('Extracted project.json:', projectJson)
			} else {
				throw new Error('Not a Scratch project')
			}
		} catch (err) {
			console.error('Failed to unzip project:', err)
			error = 'Could not parse project file.'
		}
	}

	async function handleFileSelection(file: File | Blob) {
		error = ''
		hasFile = true

		if (file instanceof File) {
			title = file.name.replace(/\.[^/.]+$/, '')
		} else {
			title = 'Imported Project'
		}

		const dataTransfer = new DataTransfer()
		const fileObj =
			file instanceof File ? file : new File([file], 'project.apz', { type: 'application/x-zip' })
		dataTransfer.items.add(fileObj)
		fileInput.files = dataTransfer.files

		// Extract the JSON data
		await extractProjectJson(fileObj)
	}

	function onFileChange(e: Event) {
		const target = e.target as HTMLInputElement
		const file = target.files?.[0]
		if (file) handleFileSelection(file)
	}

	onMount(() => {
		const params = new URLSearchParams(window.location.search)
		const origin = params.get('import_from')

		if (origin) {
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
		if (typeof window !== 'undefined') {
			window.removeEventListener('message', handleMessage)
		}
	})
</script>

<form
	method="POST"
	enctype="multipart/form-data"
	use:enhance={() => {
		loading = true
		error = ''
		return async ({ result }) => {
			loading = false
			// Handle redirect or state updates here
		}
	}}
	class="m-auto my-16 flex max-w-3xl flex-col gap-6"
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

		<p>
			On this page you can upload a project to AmpMod.
			<b class="mt-1 block">
				The AmpMod Website does not support programming languages other than Scratch 3.0, TurboWarp
				or AmpMod.
			</b>
		</p>

		<p>
			By uploading you agree to the <a href="/terms" class="link text-accent underline"
				>terms of service</a
			> for AmpMod.
		</p>

		<p>Using the online AmpMod editor? Consider simply using the "Upload" button.</p>

		{#if loading && isMessageImport}
			<div
				class="rounded bg-yellow-100 p-3 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-red-200"
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
			class="flex flex-col gap-4 rounded border-l-4 border-l-blue-500 bg-neutral-100 p-4 dark:bg-neutral-800"
			transition:fade
		>
			<h3 class="text-xl font-bold">Project Details</h3>

			{#if projectJson?.meta.platform && projectJson.meta.platform?.name !== 'TurboWarp' && projectJson.meta.platform?.name !== 'AmpMod'}
				<p class="rounded bg-red-500 p-2 font-bold text-white">
					This project was created for {#if projectJson?.meta?.platform.url}
						<a
							href={projectJson.meta.platform.url}
							rel="noreferrer noopener"
							target="_blank"
							class="underline">{projectJson.meta?.platform?.name || '(unknown)'}</a
						>.
					{:else}
						{projectJson.meta?.platform?.name || '(unknown)'}.
					{/if}
					Incompatible projects are against the Terms of Service. Please test this project in AmpMod and
					ensure it functions exactly as it does in {projectJson.meta.platform?.name ||
						'the origin platform'} before uploading it.
				</p>
			{/if}

			<div class="flex flex-col gap-2">
				<label for="title" class="text-sm font-semibold">Title</label>
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
				<label for="notes" class="text-sm font-semibold">Notes and Credits</label>
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
