<script lang="ts">
	import '../app.css'
	import { modals } from '$lib/modals.svelte'
	import LoginModal from '$lib/components/LoginModal.svelte'
	import { invalidateAll } from '$app/navigation'
	import { onMount } from 'svelte'
	import ToastContainer from '$lib/components/ToastContainer.svelte'
	import { addToast } from '$lib/toast.svelte'
	import ReportModal from '$lib/components/ReportModal.svelte'
	import PatchNotes from '$lib/components/PatchNotes.svelte'
	import { generateAccentVariants } from '$lib/accent-colour'

	let { children, data } = $props()

	let mounted = $state(false)

	let theme = $derived.by(() => {
		const hex = data?.accentColour
		if (!hex || hex.toLowerCase() === '#4fa55c') return null

		try {
			return generateAccentVariants(hex)
		} catch {
			return null
		}
	})

	let themeStyle = $derived(
		theme
			? `--color-accent: ${theme.primary}; --color-accent-secondary: ${theme.secondary}; --color-accent-tertiary: ${theme.tertiary}; --color-accent-light: ${theme.light}; --color-accent-almost-light: ${theme.almostLight};`
			: undefined,
	)

	$effect(() => {
		if (!mounted) return

		const root = document.documentElement
		const themeVars = {
			'--color-accent': theme?.primary,
			'--color-accent-secondary': theme?.secondary,
			'--color-accent-tertiary': theme?.tertiary,
			'--color-accent-light': theme?.light,
			'--color-accent-almost-light': theme?.almostLight,
		}

		if (theme) {
			for (const [key, val] of Object.entries(themeVars)) {
				if (val) root.style.setProperty(key, val)
			}
		} else {
			for (const key of Object.keys(themeVars)) {
				root.style.removeProperty(key)
			}
		}

		return () => {
			for (const key of Object.keys(themeVars)) {
				root.style.removeProperty(key)
			}
		}
	})

	function removePatchFromVersion(v: string) {
		const version = v.split('-')[0].split('+')[0].split('.')
		return `${version[0]}.${version[1]}.${version[2]}`
	}

	onMount(() => {
		mounted = true
		document.getElementById('aw3-loading')?.remove()
		if (data?.sessionDeleted) {
			console.warn('Session has been deleted!')
			invalidateAll().then(() =>
				addToast({
					text: 'Your session has been revoked. This could be because it has expired, or another user on this account has revoked the session.',
				}),
			)
		}
		if (
			localStorage.getItem('aw3_last_read_version') !==
				removePatchFromVersion(import.meta.env.VITE_NPM_PACKAGE_VERSION) &&
			data?.user
		) {
			modals.patchnotes = true
		}
		localStorage.setItem(
			'aw3_last_read_version',
			removePatchFromVersion(import.meta.env.VITE_NPM_PACKAGE_VERSION),
		)
	})
</script>

<div style={!mounted ? themeStyle : undefined}>
	{@render children?.()}

	<LoginModal bind:open={modals.login} />
	<PatchNotes bind:open={modals.patchnotes} />
	<ReportModal />
	<ToastContainer />
</div>
