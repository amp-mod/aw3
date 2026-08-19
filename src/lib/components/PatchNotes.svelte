<script lang="ts">
	import Modal from './Modal.svelte'
	import Button from './Button.svelte'
	import { modals } from '$lib/modals.svelte'

	let { open = $bindable(false) }: { open: boolean } = $props()
</script>

<Modal bind:open title="The AmpMod website has been updated!">
	<div class="prose dark:prose-invert prose-a:text-accent prose-a:underline">
		<h2>What's new?</h2>
		<p>
			Unfortunately, despite us previously promising to, comments have not yet been added due to a
			lack of time to add them. We will add them in the next version.
		</p>
		<ul>
			<li>
				<a href="https://simpleanalytics.com">Simple Analytics</a> have been added. Simple Analytics is
				a free, privacy-respecting analytics system that does not store or sell any of your personal information.
			</li>
			<li>You can now rename your account in <a href="/settings/profile">profile settings</a>.</li>
			<li>The site is now rendered server-side.</li>
			<li>
				A red dot on your navigation bar will now show when you are ready to rank your account up to
				AmpModder.
			</li>
			<li>
				The permission system for AmpMod has been completely redone, so the site should load faster.
			</li>
			<li>AI slop text has been rewritten on the about page.</li>
			<li>
				The project notes and credits now use a rich text editor, just like About Me on profile
				pages.
			</li>
		</ul>
		<h2>Note on usernames</h2>
		<p>
			Usernames can no longer start or end with an underscore, or contain multiple consecutive
			underscores. This is to prevent errors when logging into the AmpMod Wiki when we make that
			possible, as the AmpMod Wiki software does not support these types.
		</p>
		<p>
			No accounts on ampmod.org are affected by this, but it may be important if you plan to rename
			your account using the new feature, or if you are creating an alternate account.
		</p>
	</div>
	<Button
		type="button"
		onclick={() => {
			modals.patchnotes = false
		}}>OK</Button
	>
</Modal>
