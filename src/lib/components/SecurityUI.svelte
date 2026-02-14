<script lang="ts">
	import Modal from './Modal.svelte'
	import Button from './Button.svelte'
	import { modals } from '../security-manager.svelte'

	const prompts: Record<string, { text: string }> = {
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

	const current = $derived(
		modals.type
			? prompts[modals.type]
			: { text: 'This project wants to perform a restricted action:' },
	)
</script>

<Modal bind:open={modals.show} title="Security manager" canClose={false}>
	<div class="flex flex-col gap-4 text-[15px] leading-relaxed">
		<p>{current.text}</p>

		{#if modals.url}
			<div class="font-mono">
				{modals.url}
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

			<Button onclick={() => modals.resolve(true)} class="flex-1">Allow</Button>
		</div>
	</div>
</Modal>
