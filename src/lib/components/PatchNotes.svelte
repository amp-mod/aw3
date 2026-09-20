<script lang="ts">
	import Modal from './Modal.svelte'
	import Button from './Button.svelte'
	import { modals } from '$lib/modals.svelte'

	let { open = $bindable(false) }: { open: boolean } = $props()
</script>

<Modal bind:open title="The AmpMod website has been updated!">
	<div class="prose dark:prose-invert prose-a:text-accent prose-a:underline">
		<h2>New Features</h2>
		<ul>
			<!--<li>
				Studios (previously announced as "galleries") have been added! You can now invite users and
				add projects to studios.
			</li>-->
			<li>You can now change the green used on the site to another colour in settings.</li>
			<li>You can now view all projects made by other users.</li>
			<li>The default profile picture has been slightly changed.</li>
			<li>A new "Copyright" page has been added.</li>
		</ul>
		<h2>Miscellaneous Changes</h2>
		<ul>
			<li>The pirate language has been removed.</li>
			<li>More parts of the site are ready to translate.</li>
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
