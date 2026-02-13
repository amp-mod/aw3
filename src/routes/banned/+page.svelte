<script>
	import Button from '$lib/components/Button.svelte'

	let { data } = $props()

	const expiryDate = data.user.bannedExpiry
		? data.user.bannedExpiry.toLocaleString('en-GB', {
				dateStyle: 'full',
				timeStyle: 'medium',
			})
		: null
	async function logout() {
		try {
			const res = await fetch('/auth/logout', { method: 'POST' })
			if (res.ok) {
				location.reload()
			} else {
				console.error('Logout failed')
			}
		} catch (err) {
			console.error(err)
		}
	}
</script>

<svelte:head>
	<title>Banned - AmpMod</title>
</svelte:head>

<div
	class="mx-auto my-12 flex max-w-2xl flex-col gap-4 rounded border border-neutral-200 bg-neutral-100 p-8 dark:border-neutral-800 dark:bg-neutral-900"
>
	<h1 class="text-3xl font-bold">Account banned</h1>
	<p>
		Your AmpMod account, @{data.user.username}, has been blocked from logging in for violating our
		guidelines.
	</p>

	<p class="font-semibold">
		Reason: <span class="font-normal">{data.user.banReason ?? 'No reason provided.'}</span>
	</p>
	<h2 class="text-2xl font-bold">To unban your account:</h2>
	{#if !expiryDate}
		<p>
			If you have any questions or want to appeal this ban, please contact ampelectrecuted@gmail.com
			with as much info as possible.
		</p>
	{:else}
		<p>
			This ban will be automatically lifted if you log in on {expiryDate}, or at any later time. Do
			not appeal temporary bans.
		</p>
	{/if}
	<p>
		Please note that creating new accounts or using existing ones to get around a ban is not allowed
		and may result in more serious consequences.
	</p>

	<div><Button onclick={logout}>Log out</Button></div>
</div>
