<script lang="ts">
	import Modal from './Modal.svelte'
	import Button from './Button.svelte'
	import { modals } from '$lib/modals.svelte'

	let { open = $bindable(false) }: { open: boolean } = $props()
</script>

<Modal bind:open title="The AmpMod website has been updated!">
	<div class="prose dark:prose-invert prose-a:text-accent prose-a:underline">
		<h2>What's new?</h2>
		<ul>
			<li>
				You can now invite users to AmpMod! Send a link to another user on other sites. When they
				sign up, they will automatically become an AmpModder (if you also are).
			</li>
			<li>Frames are adjusted.</li>
			<li>Better security for admins.</li>
			<li>Guidelines have finally been finished.</li>
			<li>Removed blue editor banner.</li>
		</ul>
	</div>
	<Button
		type="button"
		onclick={() => {
			modals.patchnotes = false
		}}>OK</Button
	>
</Modal>
