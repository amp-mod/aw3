import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is string => {
  if (param.startsWith('0')) {
    return false;
  }
  return /^[0-9]+$/.test(param);
}) satisfies ParamMatcher;
