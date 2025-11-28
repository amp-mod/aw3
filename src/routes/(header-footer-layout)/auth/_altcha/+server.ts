import type { RequestHandler } from './$types';
import { createChallenge } from 'altcha-lib';
import { hmacKey } from '$lib/server/hmac';

export const GET: RequestHandler = async () => {
  const challenge = await createChallenge({ hmacKey });
  return new Response(JSON.stringify(challenge), {
    headers: { 'Content-Type': 'application/json' }
  });
};
