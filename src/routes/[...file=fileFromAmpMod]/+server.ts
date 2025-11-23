// src/routes/somepath/+server.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

const PAGES_DIR = path.resolve('.ampmod');
const PAGES_REPO = 'https://codeberg.org/ampmod/pages';

function cloneIfNeeded() {
  if (!fs.existsSync(PAGES_DIR)) {
    console.log('pages folder missing — cloning...');
    execSync(`git clone ${PAGES_REPO} ${PAGES_DIR} --depth=1 -b canary`, { stdio: 'inherit' });
  }
}

export const GET: RequestHandler = async ({ url }) => {
  // Ensure repo exists
  cloneIfNeeded();

  // Map path from URL to file in pages repo
  const filePath = path.join(PAGES_DIR, url.pathname.replace(/^\/ampmod/, '') || '/editor.html');

  if (!fs.existsSync(filePath)) {
    error(404);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const contentType = filePath.endsWith('.html')
    ? 'text/html'
    : filePath.endsWith('.js')
      ? 'application/javascript'
      : filePath.endsWith('.css')
        ? 'text/css'
        : 'application/octet-stream';

  return new Response(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      Server: 'aw3'
    }
  });
};
