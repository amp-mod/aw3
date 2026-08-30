<script>
	import { enhance } from '$app/forms'
	import Button from '$lib/components/Button.svelte'
	import { getPfpPath } from '$lib/storage-helpers.js'
	import { Cat } from '@lucide/svelte'

	let { data, form } = $props()
	let formElement = $state()

	let isPrivate = $state(data.user.isPrivate)
	let isPending = $state(false)

	$effect(() => {
		isPrivate = data.user.isPrivate
	})

	const handleEnhance = () => {
		isPending = true
		return async ({ result, update }) => {
			if (result.type === 'failure' || result.type === 'error') {
				isPrivate = data.user.isPrivate
			}
			await update()
			isPending = false
		}
	}

	let daysRemaining = $derived(() => {
		if (!data.user?.usernameUpdatedAt) return 0
		const updatedTime = new Date(data.user.usernameUpdatedAt).getTime()
		const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000
		const diffInMs = updatedTime + fourteenDaysInMs - Date.now()
		return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)))
	})
</script>

{#snippet settingToggle(id, name, label, description, bindValue)}
	<div class="inline-flex items-start gap-3 py-2">
		<input
			{id}
			{name}
			type="checkbox"
			bind:checked={bindValue.value}
			disabled={isPending}
			onchange={() => formElement.requestSubmit()}
			class="mt-1 h-4 w-4 rounded border-black/10 text-neutral-800 focus:ring-neutral-500 disabled:cursor-not-allowed"
		/>
		<div class="flex flex-col gap-0.5">
			<label for={id} class="cursor-pointer text-sm font-medium text-neutral-800 dark:text-white">
				{label}
			</label>
			{#if description}
				<p class="text-xs text-neutral-500 dark:text-neutral-400">
					{description}
				</p>
			{/if}
		</div>
	</div>
{/snippet}

<h2 class="mb-2 text-3xl font-bold">Profile</h2>

<div class="flex flex-col gap-1">
	<p>Change your bio, profile picture, or featured project on your profile page:</p>

	<div>
		<Button class="inline-flex items-center gap-2" href={`/users/${data.user.username}`}>
			<img
				src={getPfpPath(data.user)['32']}
				alt="Your user icon"
				class="h-7 w-7 rounded border border-black/10"
			/>
			Visit profile
		</Button>
	</div>
	<form
		method="POST"
		action="?/updateSettings"
		use:enhance={handleEnhance}
		bind:this={formElement}
		class="flex flex-col gap-4 {isPending ? 'opacity-70' : ''}"
	>
		{@render settingToggle(
			'privateProfile',
			'isPrivate',
			'Hide my profile from other users',
			'Regardless of this setting, AmpMod moderators will still be able to see your profile.',
			{
				get value() {
					return isPrivate
				},
				set value(v) {
					isPrivate = v
				},
			},
		)}
	</form>
	<h3 class="text-2xl font-semibold">Username</h3>
	{#if data.availableSettings.includes('username') && data.canUpdateUsername}
		<p>
			<strong
				>Warning: Renaming your account will break old links to your profile, including mentions in
				bios, comments, and other content.</strong
			>
		</p>
		<p>After renaming your account, you will be unable to rename it again for the next 2 weeks.</p>
		<form method="POST" action="?/updateUsername" use:enhance class="flex flex-col gap-4">
			{#if form?.error}
				<p>{form.error}</p>
			{/if}
			<input class="input" type="text" name="username" placeholder="New username" required />
			<Button type="submit">Rename account</Button>
		</form>
	{:else if !data.canUpdateUsername}
		<p>
			You already changed your username. You can change it again in {daysRemaining()}
			{daysRemaining() === 1 ? 'day' : 'days'}.
		</p>
		<p>
			During this period, your old username will redirect to your new one, and nobody else can use
			it.
		</p>
		<p>
			If you urgently need to change your username, please contact AmpMod support to skip this
			cooldown.
		</p>
	{:else if !data.availableSettings.includes('username')}
		<p>Rank up to rename your account</p>
	{/if}
	<h3 class="text-2xl font-semibold">Link to your Scratch profile</h3>
	<p>When you link your AmpMod account to Scratch, a link to your Scratch profile will be added.</p>
	<div>
		<Button class="inline-flex items-center gap-2" href="/settings/link-scratch"
			><Cat />Go to Scratch linking settings</Button
		>
	</div>
</div>
