import { canPerformAction } from '$lib/server/permissions'
import { error } from '@sveltejs/kit'

export function load({ locals }) {
	if (!canPerformAction(locals.user, 'accessAdminPanel')) throw error(403)
}
