<script lang="ts">
	import Modal from './Modal.svelte'
	import Button from './Button.svelte'
	import { modals } from '$lib/modals.svelte'

	let { open = $bindable(false) }: { open: boolean } = $props()
</script>

<Modal bind:open title="The AmpMod website has been updated!">
	<div class="prose dark:prose-invert prose-a:text-accent prose-a:underline">
		<p>This update is a complete UI refresh.</p>
		<h2>New Features</h2>
		<ul>
			<li>
				The navigation bar has been fully redesigned! This makes it easier to use on touchscreens
				and look a bit more modern.
			</li>
			<li>All pages are now wider than previously.</li>
		</ul>
		<h2>Our temporary versioning system</h2>
		<p>
			Until AmpMod 0.5 is released, the site will increase its patch version instead of its minor
			version.
		</p>
		<p>
			This is because we are unifying the editor and the website's release schedule so that they
			share "minor" versions.
		</p>
	</div>
	<Button
		type="button"
		onclick={() => {
			modals.patchnotes = false
		}}>OK</Button
	>
</Modal>
