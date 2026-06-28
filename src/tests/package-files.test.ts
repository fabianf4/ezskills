import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolvePaths } from '../config/paths.js';

const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..');
const PACKAGE_JSON = resolve(PROJECT_ROOT, 'package.json');
const GITIGNORE = resolve(PROJECT_ROOT, '.gitignore');
const CATALOG_INDEX = resolve(PROJECT_ROOT, 'catalog', 'index.json');
const DIST_CATALOG_INDEX = resolve(PROJECT_ROOT, 'dist', 'catalog', 'index.json');

describe('package publish boundaries', () => {
  it('catalog/index.json is not present in the working tree', () => {
    expect(existsSync(CATALOG_INDEX)).toBe(false);
  });

  it('dist/catalog/index.json is not present in the working tree', () => {
    expect(existsSync(DIST_CATALOG_INDEX)).toBe(false);
  });

  it('.gitignore excludes catalog/index.json', () => {
    const contents = readFileSync(GITIGNORE, 'utf-8');
    expect(contents).toMatch(/^catalog\/index\.json\s*$/m);
  });

  it('.gitignore excludes local install targets (.opencode/ and skills/)', () => {
    const contents = readFileSync(GITIGNORE, 'utf-8');
    expect(contents).toMatch(/^\.opencode\/?\s*$/m);
    expect(contents).toMatch(/^skills\/?\s*$/m);
  });

  it('package.json files excludes catalog/index.json (no stale cache in the tarball)', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf-8')) as {
      files?: unknown;
    };
    expect(Array.isArray(pkg.files)).toBe(true);
    const files = pkg.files as string[];
    expect(files).toContain('catalog');
    expect(files).toContain('!catalog/index.json');
  });

  it('indexPath never points inside dist/ (regression of the offset bug)', () => {
    const paths = resolvePaths(PROJECT_ROOT, resolve(PROJECT_ROOT, 'catalog'));
    expect(paths.indexPath.startsWith(resolve(PROJECT_ROOT, 'dist'))).toBe(false);
  });
});
