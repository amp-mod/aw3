import { isValidUsername } from '$lib/username'
import type { ParamMatcher } from '@sveltejs/kit'

export const match = isValidUsername satisfies ParamMatcher
