import type { ParamMatcher } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export const match: ParamMatcher = (param) => {
  try {
    const filePath = path.resolve('.ampmod', path.normalize(param));
    return fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory();
  } catch {
    return false;
  }
};
