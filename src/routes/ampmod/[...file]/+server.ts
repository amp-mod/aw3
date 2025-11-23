import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import './sync';

const PAGES_DIR = path.resolve('.ampmod');
const PAGES_REPO = 'https://codeberg.org/ampmod/pages';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.json': 'application/json'
};

function cloneIfNeeded() {
  if (!fs.existsSync(PAGES_DIR)) {
    console.log(
      'Cloning the aw3 build. This should only happen once unless the .ampmod folder is deleted.'
    );
    execSync(`git clone ${PAGES_REPO} ${PAGES_DIR} --depth=1 -b aw3`, { stdio: 'inherit' });
  }
}

export const GET: RequestHandler = async ({ url }) => {
  cloneIfNeeded();
  const filePath = path.join(PAGES_DIR, url.pathname.replace(/^\/ampmod/, ''));

  if (!fs.existsSync(filePath)) {
    error(404);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

  return new Response(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      Server: 'aw3'
    }
  });
};
