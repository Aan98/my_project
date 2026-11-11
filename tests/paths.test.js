// The app is hosted in a subfolder on GitHub Pages
// (https://<user>.github.io/<repo>/), so every file path must be relative.
// A path starting with "/" would point outside the app's folder.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

function appFiles(dir) {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return appFiles(path);
    return /\.(html|css|js)$/.test(entry.name) ? [path] : [];
  });
}

const PATH_PATTERNS = [
  /(?:src|href)\s*=\s*["']([^"']+)["']/g, // HTML attributes
  /\bfrom\s+["']([^"']+)["']/g, // static imports
  /\bimport\s*\(\s*["']([^"']+)["']/g, // dynamic imports
  /url\(\s*["']?([^"')]+)["']?\s*\)/g, // CSS url()
];

test('every file path in the app is relative', () => {
  const files = ['index.html', ...appFiles('css'), ...appFiles('js')];
  const absolute = [];
  for (const file of files) {
    const text = readFileSync(join(ROOT, file), 'utf8');
    for (const pattern of PATH_PATTERNS) {
      for (const [, path] of text.matchAll(pattern)) {
        if (path.startsWith('/') || /^[a-z]+:/i.test(path)) absolute.push(`${file}: ${path}`);
      }
    }
  }
  assert.deepEqual(absolute, []);
});
