<script>
	import { invalidateAll } from '$app/navigation'
	import Button from '$lib/components/Button.svelte'
	import { onMount } from 'svelte'
	import { modals } from '$lib/modals.svelte'
	onMount(() => invalidateAll())
</script>

<svelte:head>
	<title>Session hijacked - AmpMod</title>
</svelte:head>

<div
	class="mx-auto my-12 flex max-w-2xl flex-col gap-4 rounded border border-red-500/50 bg-red-100 p-4 dark:bg-red-900/50"
>
	<p>
		It appears you or someone else has attempted to steal a session linked to this AmpMod account.
		Please note that session hijacking is against the <a href="/terms" class="link"
			>Terms of Service</a
		> and may result in your IP address being blocked from AmpMod.
	</p>
	<p>
		If you are the owner of this account, you can keep your account safe by not sharing your browser
		cookies with anyone else. If you recently updated your browser, this may be a false positive and
		you can log back in.
	</p>
	<div class="flex gap-3">
		<Button
			onclick={() => {
				modals.login = true
			}}>Log in</Button
		>
		<Button href="/">Back to homepage</Button>
	</div>
</div>
