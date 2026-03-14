<script lang="ts">
	import Modal from './Modal.svelte'
	import { afterNavigate, invalidateAll } from '$app/navigation'
	import { browser } from '$app/environment'

	let { open = $bindable(false) } = $props()
	let errorMessage = $state('')

	afterNavigate(() => {
		open = false
		errorMessage = ''
	})

	function goBack() {
		if (browser) {
			window.history.back()
		}
	}
</script>

<Modal bind:open title="Session Revoked">
	<p>
		Your session has been revoked. This could be because it has expired, or another user on this
		account has revoked the session.
	</p>
</Modal>
