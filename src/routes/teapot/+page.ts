import { error } from '@sveltejs/kit';

export function load() {
  throw error(418, "I'm a teapot");
}
