<script lang="ts">
	import Modal from './Modal.svelte'
	import Button from './Button.svelte'
	import { modals } from '$lib/modals.svelte'

	let { open = $bindable(false) }: { open: boolean } = $props()
</script>

<Modal bind:open title="The AmpMod website has been updated!">
	<div class="prose dark:prose-invert prose-a:text-accent prose-a:underline">
		<p>
			Unfortunately, all text and project code on the site created after the 23rd of August has been
			deleted (profile pictures and project thumbnails are not affected if their respective content
			was created beforehand). We are very sorry for this, and we are working on a better backup
			solution that will prevent this from happening again.
		</p>
		<p>
			We had to rush this release out of the door due to this, so studios (previously announced as
			"galleries") have been postponed.
		</p>
		<h2>New Features</h2>
		<ul>
			<!--<li>
				Studios (previously announced as "galleries") have been added! You can now invite users and
				add projects to studios.
			</li>-->
			<li>You must now verify your email.</li>
			<li>You can now reset your password in case you forget it.</li>
		</ul>
		<h2>Miscellaneous Changes</h2>
		<ul>
			<li>
				Due to the incident, project uploading is now rate limited. If you are a New AmpModder, you
				can only upload a new project once every five minutes. This is reduced to one minute for
				ranked-up AmpModders.
			</li>
			<li>We now cache the main page and other data to speed up loading pages.</li>
			<li>The header and footer have been added back to the error page.</li>
			<li>Some security issues with the site have been fixed.</li>
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
