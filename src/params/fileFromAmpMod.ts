import type { ParamMatcher } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export const match: ParamMatcher = (param) => {
  try {
    const filePath = path.resolve('.ampmod', path.normalize(param));
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
};
