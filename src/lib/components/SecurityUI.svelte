<script lang="ts">
	import Modal from './Modal.svelte'
	import Button from './Button.svelte'
	import { modals } from '../security-manager.svelte'
	let textareaElement: HTMLTextAreaElement | undefined = $state()

	const prompts: Record<string, { text: string }> = {
		loadExtension: { text: 'This project wants to load an extension with the following code:' },
		fetch: { text: 'This project wants to connect to this site:' },
		openWindow: { text: 'This project wants to open an external link:' },
		redirect: { text: 'This project is attempting to navigate this tab to:' },
		download: { text: 'This project wants to save a file to your device:' },
		recordAudio: { text: 'This project wants microphone access.' },
		recordVideo: {
			text: 'This project wants camera access. Note that camera access and cloud variable access are mutually incompatible.',
		},
		readClipboard: { text: 'This project wants to access your clipboard data.' },
		notify: { text: 'This project wants to send you system notifications.' },
		embed: { text: 'This project wants to embed the page at the following link:' },
	}

	let allowDisabled = $state(false)
	$effect(() => {
		if (modals.show) {
			allowDisabled = true
			const timer = setTimeout(() => {
				allowDisabled = false
			}, 1000)

			return () => clearTimeout(timer)
		} else {
			// Reset state when closed
			allowDisabled = false
		}
	})

	const current = $derived(
		modals.type
			? prompts[modals.type]
			: { text: 'This project wants to perform a restricted action:' },
	)
</script>

<Modal bind:open={modals.show} title="Security manager" canClose={false}>
	<div class="flex flex-col gap-4 text-[15px]">
		<p>{current.text}</p>

		{#if modals.url}
			<div class="font-mono">
				{modals.url}
			</div>
		{/if}
		{#if modals.code}
			<textarea
				readonly
				bind:this={textareaElement}
				class="h-40 border border-neutral-500 p-2 font-mono"
				value={modals.code}
			></textarea>
		{/if}

		{#if modals.type === 'loadExtension'}
			<div class="rounded bg-red-500 p-2 font-bold text-white">
				Extensions load unsandboxed on the website, which may have certain security implications.
				Run this project in the editor if you want to enable the sandbox (but this breaks many
				extensions).
			</div>
		{/if}

		<div>
			{#if modals.type === 'fetch'}
				This connection can be used to transfer data, host a multiplayer server, or access remote
				APIs. As usual, the server can access your IP address like any other, even though most
				modern servers don't log it.
			{:else}
				Only grant this permission if you trust this project and its origin. Granting access may
				allow the extension to interact with your data or external services.
			{/if}
		</div>

		<p>If you believe this project is malicious, please report it.</p>

		<div class="mt-2 flex gap-4">
			<Button onclick={() => modals.resolve(false)} class="flex-1">Deny</Button>

			<Button onclick={() => modals.resolve(true)} class="flex-1" disabled={allowDisabled}
				>Allow</Button
			>
		</div>
	</div>
</Modal>
