<script lang="ts">
	import { enhance } from '$app/forms'
	import Button from '$lib/components/Button.svelte'
	import { Smartphone, Globe, Calendar, Tablet, Bot, Monitor } from '@lucide/svelte'
	import Bowser from 'bowser'

	let { data } = $props()

	function formatDate(date: Date) {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(new Date(date))
	}
	function getSessionDetails(uaString: string | null) {
		if (!uaString) {
			return { name: 'Unknown Device', details: 'Unknown', icon: Globe }
		}

		const browser = Bowser.getParser(uaString)
		const b = browser.getBrowser()
		const os = browser.getOS()
		const platform = browser.getPlatform()

		let Icon = Monitor
		if (uaString.toLowerCase().includes('postman')) Icon = Globe
		else if (uaString.toLowerCase().includes('scratchattach')) Icon = Bot
		else if (platform.type === 'tablet') Icon = Tablet
		else if (platform.type === 'mobile') Icon = Smartphone

		return {
			name: `${b.name} ${b.version}, ${os.name} ${os.versionName || os.version || ''}`,
			icon: Icon,
		}
	}
</script>

<h2 class="mb-2 text-3xl font-bold">Sessions</h2>

<p class="mb-2">Sessions are what keep you logged into AmpMod on different devices.</p>

<div
	class="mb-6 flex items-center gap-2 rounded bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-800/20 dark:text-amber-200"
>
	<p>If you see a session you don't recognize, change your password immediately.</p>
</div>

<div class="flex flex-col gap-4">
	{#each data.sessions as session}
		{@const DeviceIcon = getSessionDetails(session.userAgent).icon}
		<div
			class="flex items-center justify-between rounded border border-black/5 p-4 transition-colors dark:border-white/5 dark:bg-neutral-800/50"
		>
			<div class="flex items-center gap-4">
				<div class="rounded-full">
					<DeviceIcon size={20} />
				</div>

				<div class="flex flex-col gap-0.5">
					<span
						class="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-white"
					>
						{session.ip}
						{#if session.isCurrent}(This session){/if}
					</span>

					<span
						class="max-w-[250px] truncate text-xs text-neutral-500 sm:max-w-md"
						title={session.userAgent}
					>
						{getSessionDetails(session.userAgent).name}
					</span>

					<span class="flex items-center gap-1 text-[10px] tracking-tight text-neutral-400">
						<Calendar size={10} />
						Expires at {formatDate(session.expiresAt)}
					</span>
				</div>
			</div>

			<form
				method="POST"
				action="?/revoke"
				use:enhance={() => {
					return async ({ update }) => {
						await update()
					}
				}}
			>
				<input type="hidden" name="sessionId" value={session.id} />
				<Button type="submit" class="!px-3 !py-1 !text-xs">
					{session.isCurrent ? 'Logout' : 'Revoke'}
				</Button>
			</form>
		</div>
	{/each}
</div>
