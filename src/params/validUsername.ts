import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is string => {
  return /^[A-Za-z0-9\-\_]{3,20}$/.test(param);
}) satisfies ParamMatcher;
