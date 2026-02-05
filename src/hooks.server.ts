import { sequence } from '@sveltejs/kit/hooks';
import * as auth from '$lib/server/auth';
import { error, type Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import events from 'storybook/internal/core-events';

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;

    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
    });
  });

const handleAuth: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(auth.sessionCookieName);

  if (!sessionToken) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await auth.validateSessionToken(sessionToken);

  if (session) {
    auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
  } else {
    auth.deleteSessionTokenCookie(event);
  }

  event.locals.user = user;
  event.locals.session = session;
  return resolve(event);
};

const handleGuard: Handle = async ({ event, resolve }) => {
  const isAdminRoute = event.route.id?.startsWith('/admin');

  if (isAdminRoute) {
    if (!event.locals.user || (event.locals.user.rank !== 3 && !process.env.AW3_FORCE_ADMIN)) {
      throw error(
        403,
        "You aren't an operator and therefore are not authorised to access the admin panel."
      );
    }
  }

  return resolve(event);
};

export const handle: Handle = sequence(handleAuth, handleGuard, handleParaglide);
