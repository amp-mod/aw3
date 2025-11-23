import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { RequestHandler } from '../../../../ampmod/$types';

const PAGES_DIR = path.resolve('.ampmod');
const PAGES_REPO = 'https://codeberg.org/ampmod/pages';

function cloneIfNeeded() {
  if (!fs.existsSync(PAGES_DIR)) {
    console.log('pages folder missing — cloning...');
    execSync(`git clone ${PAGES_REPO} ${PAGES_DIR} --depth=1 -b aw3`, { stdio: 'inherit' });
  }
}

export const GET: RequestHandler = async () => {
  cloneIfNeeded();
  const filePath = path.join(PAGES_DIR, '/fullscreen.html');

  const fileBuffer = fs.readFileSync(filePath);
  return new Response(fileBuffer, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
};
