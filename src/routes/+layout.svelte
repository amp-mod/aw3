<script lang="ts">
	import '../app.css'
	import { modals } from '$lib/modals.svelte'
	import favicon from '$lib/assets/favicon.ico'
	import LoginModal from '$lib/components/LoginModal.svelte'
	import { afterNavigate, invalidateAll } from '$app/navigation'
	import { onMount } from 'svelte'
	import ToastContainer from '$lib/components/ToastContainer.svelte'
	import { addToast } from '$lib/toast.svelte'
	import ReportModal from '$lib/components/ReportModal.svelte'

	let { children, data } = $props()

	onMount(() => {
		if (data.sessionDeleted) {
			console.warn('Session has been deleted!')
			invalidateAll().then(() =>
				addToast({
					text: 'Your session has been revoked. This could be because it has expired, or another user on thisaccount has revoked the session.',
				}),
			)
		}
		console.warn(
			'%cSTOP NOW!%cPasting code here can allow an attacker to LOG IN to your account. Read the AmpMod FAQ for more information.',
			'font-size: 3em; font-weight: bold; display: block; font-family: sans-serif;',
			'font-size: 1.5em; font-weight: bold; font-family: sans-serif;',
		)
	})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>AmpMod</title>
</svelte:head>

{@render children?.()}

<LoginModal bind:open={modals.login} />
<ReportModal />
<ToastContainer />
