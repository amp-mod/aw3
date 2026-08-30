<script lang="ts">
	import Modal from './Modal.svelte'
	import Button from './Button.svelte'
	import { modals } from '$lib/modals.svelte'

	let { open = $bindable(false) }: { open: boolean } = $props()
</script>

<Modal bind:open title="The AmpMod website has been updated!">
	<div class="prose dark:prose-invert prose-a:text-accent prose-a:underline">
		<p>
			Version 0.4.2 of this site is still unrelated to AmpMod editor 0.4. It should be obvious.
			We've said that before.
		</p>
		<p>
			However, version 0.5 of the website <em>will</em> be related to AmpMod editor 0.5, because we are
			unifying the release schedule of them. That's why this release isn't called 0.5.
		</p>
		<h2>What's new?</h2>
		<ul>
			<!--<li>You can now invite users to AmpMod! Send a link to another user on other sites. When they sign up, they will automatically become an AmpModder (if you also are).</li>-->
			<li>The signup form has been redesigned slightly.</li>
			<li>
				Altcha has been replaced with Cloudflare Turnstile. This is because Altcha was broken,
				preventing new users from signing up.
			</li>
			<li>A new frame, "TV", has been added.</li>
		</ul>
	</div>
	<Button
		type="button"
		onclick={() => {
			modals.patchnotes = false
		}}>OK</Button
	>
</Modal>
