import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
const PAGES_DIR = path.resolve('.ampmod');
function pullIfExists() {
  if (!fs.existsSync(PAGES_DIR)) return;

  try {
    execSync(`git -C ${PAGES_DIR} pull --ff-only`, { stdio: 'ignore' });
  } catch (err) {
    console.warn('[aw3] Failed to update .ampmod repo:', err);
  }
}
pullIfExists();
setInterval(pullIfExists, 3 * 60 * 60 * 1000);
