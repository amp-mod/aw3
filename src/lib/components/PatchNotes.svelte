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
			<li>
				<a href="https://forums.ampmod.org" target="_blank">The new forums</a> have been released.
				You can log in with the account you use on ampmod.org. Please remember to follow the
				<a href="/guidelines">ampmod.org guidelines</a> when posting on the forums.
			</li>
			<!--<li>
				A new Helper rank has been released on the site! We will soon run an election for the first
				helpers, and we may appoint some helpers who were former moderators on previous AmpMod
				sites.
			</li>-->
			<li>You can now unshare or share projects from My Stuff page.</li>
			<li>
				The My Stuff page has been slightly redesigned. A new "Projects" tab has been added to
				combine "Shared" and "Unshared" projects.
			</li>
		</ul>
		<h2>Miscellaneous Changes</h2>
		<ul>
			<li>
				Some backend changes have been made behind the scenes. Uploading projects should be slightly
				faster.
			</li>
			<li>
				All uploads are now shared with other projects. This shouldn't matter much to most users,
				but it saves space on the server.
			</li>
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
