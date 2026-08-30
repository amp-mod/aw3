<script>
	let { data } = $props()
	import { browser } from '$app/environment'
	import Button from '$lib/components/Button.svelte'
</script>

<div class="flex flex-col gap-1">
	<h2 class="mb-2 text-3xl font-bold">Invite users</h2>
	<p>AmpMod is a small website, but we're giving you the opportunity to make it grow!</p>
	{#if browser}
		{@const inviteLink = `${window.location.origin}/auth/register?inv=${data.inviteId}`}
		<p>
			Your invite link is <a href={inviteLink} class="link">{inviteLink}</a>. Share it with friends!
		</p>
		<div>
			<Button onclick={() => navigator.clipboard.writeText(inviteLink)}>Copy link</Button>
		</div>
	{/if}
</div>
