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
	import PatchNotes from '$lib/components/PatchNotes.svelte'

	let { children, data } = $props()
	function removePatchFromVersion(v: string) {
		const version = v.split('-')[0].split('+')[0].split('.')

		// TODO: Website and editor versions are being unified, so until AmpMod 0.5 is released,
		// we will include the patch version. When AmpMod 0.5 is released, we will remove this.
		return `${version[0]}.${version[1]}.${version[2]}`
	}

	onMount(() => {
		document.getElementById('aw3-loading')?.remove()
		if (data.sessionDeleted) {
			console.warn('Session has been deleted!')
			invalidateAll().then(() =>
				addToast({
					text: 'Your session has been revoked. This could be because it has expired, or another user on thisaccount has revoked the session.',
				}),
			)
		}
		if (
			localStorage.getItem('aw3_last_read_version') !==
				removePatchFromVersion(import.meta.env.VITE_NPM_PACKAGE_VERSION) &&
			data.user
			//&& localStorage.getItem('aw3_last_read_version')
		) {
			modals.patchnotes = true
		}
		localStorage.setItem(
			'aw3_last_read_version',
			removePatchFromVersion(import.meta.env.VITE_NPM_PACKAGE_VERSION),
		)
		console.log(
			'%cSTOP NOW!%cPasting code here can allow an attacker to LOG IN to your account. Read the AmpMod FAQ for more information.',
			'font-size: 3em; font-weight: bold; display: block; color: red;',
			'font-size: 1.5em; font-weight: bold;',
		)
	})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>AmpMod</title>
</svelte:head>

{@render children?.()}

<LoginModal bind:open={modals.login} />
<PatchNotes bind:open={modals.patchnotes} />
<ReportModal />
<ToastContainer />
