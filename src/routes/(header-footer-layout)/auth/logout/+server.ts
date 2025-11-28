import * as auth from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const user = event.locals.user;

  if (!user) {
    return new Response('401', {
      status: 401
    });
  }

  await auth.invalidateSession(user.id);
  auth.deleteSessionTokenCookie(event);

  return new Response('200', {
    status: 200
  });
};
