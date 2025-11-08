import { error } from '@sveltejs/kit';

export function load() {
  throw error(
    401,
    'This username is not valid. Usernames can contain lowercase numbers, letters, dashes, and underscores, and must be 3-20 characters long.'
  );
}
