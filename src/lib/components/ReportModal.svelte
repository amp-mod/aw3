<script lang="ts">
	import Modal from './Modal.svelte'
	import Button from './Button.svelte'
	import { reportState } from '$lib/report.svelte'
	import { enhance } from '$app/forms'
	import { MessageSquareWarning, CircleAlert } from '@lucide/svelte'

	let reason = $state('')
	let category = $state('')
	let isSubmitting = $state(false)

	const allCategories = {
		project: [
			{ id: 'inappropriate', label: 'Inappropriate language/content' },
			{ id: 'horror', label: 'Blood/gore/extreme horror' },
			{ id: 'malicious', label: 'Malware or malicious extensions' },
			{ id: 'copyright', label: 'Copyright / Uncredited assets' },
			{ id: 'other', label: 'Other' },
		],
		user: [
			{ id: 'username', label: 'Inappropriate username' },
			{ id: 'impersonation', label: 'Impersonating another user' },
			{ id: 'harassment', label: 'Harassment or bullying' },
			{ id: 'other', label: 'Other' },
		],
		comment: [
			{ id: 'spam', label: 'Spam or advertisement' },
			{ id: 'harassment', label: 'Harassment or hate speech' },
			{ id: 'inappropriate', label: 'Inappropriate language' },
			{ id: 'other', label: 'Other' },
		],
		gallery: [
			{ id: 'spam', label: 'Spam or advertisement' },
			{ id: 'harassment', label: 'Harassment or hate speech' },
			{ id: 'raids', label: 'This gallery is being raided' },
			{ id: 'other', label: 'Other' },
		],
	}

	const activeCategories = $derived(
		allCategories[reportState.targetType as keyof typeof allCategories] || allCategories.project,
	)

	const styles = {
		label: 'text-sm font-bold text-neutral-500 dark:text-neutral-300 mb-1 block',
		radioContainer:
			'flex flex-col gap-2 p-3 rounded bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700',
		radioLabel:
			'flex items-center gap-2 text-sm cursor-pointer hover:text-accent transition-colors',
		textarea:
			'w-full bg-transparent border border-neutral-300 dark:border-neutral-700 rounded p-2 focus:border-accent focus:outline-none dark:text-white h-24 text-sm resize-none',
		infoBox:
			'flex items-start gap-2 p-3 rounded border border-blue-500/20 bg-blue-500/5 text-sm text-blue-600 dark:text-blue-400',
	}

	$effect(() => {
		if (reportState.show) {
			category = ''
			reason = ''
		}
	})
</script>

<Modal bind:open={reportState.show} title="Report {reportState.targetType}">
	<form
		method="POST"
		action="/api/report"
		use:enhance={() => {
			isSubmitting = true
			return ({ result }) => {
				isSubmitting = false
				if (result.type === 'success') {
					reportState.show = false
				}
			}
		}}
		class="flex flex-col gap-4"
	>
		<input type="hidden" name="targetId" value={reportState.targetId} />
		<input type="hidden" name="targetType" value={reportState.targetType} />

		<div class="flex items-center gap-2 text-amber-600 dark:text-amber-400">
			<MessageSquareWarning size={18} />
			<span class="text-sm font-medium">Reporting <strong>{reportState.targetName}</strong></span>
		</div>

		<fieldset class={styles.radioContainer}>
			<legend class={styles.label}>What is the issue with this {reportState.targetType}?</legend>
			{#each activeCategories as cat}
				<label class={styles.radioLabel}>
					<input
						type="radio"
						name="category"
						value={cat.id}
						bind:group={category}
						required
						class="accent-accent"
					/>
					{cat.label}
				</label>
			{/each}
		</fieldset>

		<div>
			<label class={styles.label} for="reason">Additional details</label>
			<textarea
				id="reason"
				name="reason"
				bind:value={reason}
				required
				placeholder="Please provide context for the moderators..."
				class={styles.textarea}
			></textarea>
		</div>

		<div class="flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (reportState.show = false)}>
				{isTrap ? 'Close' : 'Cancel'}
			</Button>

			{#if !isTrap}
				<Button
					type="submit"
					disabled={isSubmitting || !reason || !category}
					class="border-none bg-red-600 text-white hover:bg-red-700"
				>
					{isSubmitting ? 'Sending...' : 'Submit Report'}
				</Button>
			{/if}
		</div>
	</form>
</Modal>
