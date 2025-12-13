import type { LayoutServerLoad } from './$types';
import { getRequestEvent } from '$app/server';

export const load: LayoutServerLoad = ({ request }) => {
  const user = getRequestEvent().locals.user;

  return {
    user
  };
};
