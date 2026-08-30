import 'unplugin-icons/types/svelte'

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: import('$lib/server/auth').SessionValidationResult['user']
			session: import('$lib/server/auth').SessionValidationResult['session']
			sessionDeleted: boolean
			activeUsers: Record<string, any>[]
			isNewAw3: boolean | null
		}
	} // interface Error {}
	interface Window {
		onloadTurnstileCallback?: () => void
		turnstile?: {
			render: (container: string | HTMLElement, options: Record<string, any>) => string
			remove: (id: string) => void
		}
	}
} // interface Locals {}
// interface PageData {}

// interface PageState {}
// interface Platform {}
export {}
