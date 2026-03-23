export interface Toast {
	id: string
	text: string
	canClose: boolean
	type: 'success' | 'failure' | 'note' | 'loading' | 'normal'
}

export const toasts = $state<Toast[]>([])

/**
 * Adds a toast to the page.
 */
export function addToast({
	text,
	expiry = 5000,
	canClose = true,
	type = 'normal',
}: {
	text: string
	expiry?: number
	canClose?: boolean
	type?: 'success' | 'failure' | 'loading' | 'normal'
}) {
	const id = crypto.randomUUID()
	toasts.unshift({ id, text, canClose, type })
	const index = toasts.findIndex((t) => t.id === id)
	setTimeout(() => {
		removeToast(id)
	}, expiry)
	return toasts[index]
}

export function removeToast(id: string) {
	const index = toasts.findIndex((t) => t.id === id)
	if (index !== -1) {
		toasts.splice(index, 1)
	}
}
