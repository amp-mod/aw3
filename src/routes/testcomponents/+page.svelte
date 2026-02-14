<script lang="ts">
	import SecurityUI from '$lib/components/SecurityUI.svelte'
	import Button from '$lib/components/Button.svelte'
	import { functions } from '$lib/security-manager.svelte'

	let lastResult = $state<boolean | string | null>(null)
	let pending = $state(false)

	async function test(name: string, fn: () => Promise<any> | any) {
		pending = true
		lastResult = 'Processing...'
		try {
			const result = await fn()
			lastResult = `${name}: ${result}`
		} catch (e) {
			lastResult = `${name} error: ${e}`
		} finally {
			pending = false
		}
	}
</script>

<div class="max-w-4xl p-4">
	<h1 class="mb-6 text-xl font-semibold">Security Manager Test</h1>

	<div class="space-y-6">
		<div>
			<p class="mb-2 text-sm font-medium text-gray-500">Network</p>
			<div class="flex flex-wrap gap-2">
				<Button onclick={() => test('Fetch', () => functions.canFetch('https://example.com'))}
					>Fetch</Button
				>
				<Button onclick={() => test('Window', () => functions.canOpenWindow('https://example.com'))}
					>Open Window</Button
				>
				<Button onclick={() => test('Redirect', () => functions.canRedirect('https://google.com'))}
					>Redirect</Button
				>
			</div>
		</div>

		<div>
			<p class="mb-2 text-sm font-medium text-gray-500">Hardware & Privacy</p>
			<div class="flex flex-wrap gap-2">
				<Button onclick={() => test('Mic', () => functions.canRecordAudio())}>Microphone</Button>
				<Button onclick={() => test('Cam', () => functions.canRecordVideo())}>Camera</Button>
				<Button onclick={() => test('Loc', () => functions.canGeolocate())}>Location</Button>
			</div>
		</div>

		<div>
			<p class="mb-2 text-sm font-medium text-gray-500">Files & UI</p>
			<div class="flex flex-wrap gap-2">
				<Button onclick={() => test('Download', () => functions.canDownload('url', 'test.png'))}
					>Download</Button
				>
				<Button onclick={() => test('Clipboard', () => functions.canReadClipboard())}
					>Clipboard</Button
				>
				<Button onclick={() => test('Notify', () => functions.canNotify())}>Notify</Button>
			</div>
		</div>

		<div>
			<p class="mb-2 text-sm font-medium text-gray-500">Logic</p>
			<div class="flex flex-wrap gap-2">
				<Button
					onclick={() =>
						test('Trusted', () =>
							functions.canLoadExtensionFromProject('https://extensions.turbowarp.org/test.js'))}
					>Check Trusted</Button
				>
				<Button
					onclick={() =>
						test('Untrusted', () =>
							functions.canLoadExtensionFromProject('https://evil.com/test.js'))}
					>Check Untrusted</Button
				>
			</div>
		</div>
	</div>

	<div class="mt-8 border-t border-gray-200 pt-4">
		<p class="mb-1 text-xs tracking-wider text-gray-400 uppercase">Result</p>
		<p class="text-sm">
			{lastResult ?? 'No tests run.'}
		</p>
	</div>
</div>

<SecurityUI />
