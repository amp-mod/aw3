import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export function load() {
  throw error(418, "I'm a teapot");
}
