<script lang="ts">
	import Modal from './Modal.svelte'
	import Button from './Button.svelte'
	import { modals } from '$lib/modals.svelte'

	let { open = $bindable(false) }: { open: boolean } = $props()
</script>

<Modal bind:open title="The AmpMod website has been updated!">
	<div class="prose dark:prose-invert prose-a:text-accent prose-a:underline">
		<h2>What's new?</h2>
		<p>This update is unrelated to AmpMod editor 0.4.</p>
		<ul>
			<li>
				Cool new profile picture frames have been added! Go to settings to choose between the Apple
				Cat, Dango, Kitten and AmpElectrecuted frames.
			</li>
			<!-- DOESN'T WORK<li>
				Projects imported from Scratch will now link to the Scratch project on their page. Projects
				imported prior to website 0.4 will not have this though, because we didn't store their
				Scratch project ID.
			</li>-->
			<li>A dialogue will now show the progress of your project being uploaded.</li>
			<li>
				The Notes and Credits text area on the upload page now uses rich text, just like on the
				project page.
			</li>
			<li>
				Line breaks have been added to the rich text editor. Press Shift+Enter when editing your
				profile's About Me or a project's Notes and Credits to enter one!
			</li>
		</ul>
	</div>
	<Button
		type="button"
		onclick={() => {
			modals.patchnotes = false
		}}>OK</Button
	>
</Modal>
