import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolvePaths } from '../config/paths.js';

const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..');
const PACKAGE_JSON = resolve(PROJECT_ROOT, 'package.json');
const GITIGNORE = resolve(PROJECT_ROOT, '.gitignore');
const CATALOG_INDEX = resolve(PROJECT_ROOT, 'catalog', 'index.json');

describe('package publish boundaries', () => {
  it('catalog/index.json is present in the working tree (committed, read-only at runtime)', () => {
    expect(existsSync(CATALOG_INDEX)).toBe(true);
    const stat = statSync(CATALOG_INDEX);
    expect(stat.isFile()).toBe(true);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('.gitignore does NOT exclude catalog/index.json (it must be committed)', () => {
    const contents = readFileSync(GITIGNORE, 'utf-8');
    expect(contents).not.toMatch(/^catalog\/index\.json\s*$/m);
  });

  it('package.json files includes catalog/ (no exclusion of index.json)', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf-8')) as {
      files?: unknown;
    };
    expect(Array.isArray(pkg.files)).toBe(true);
    const files = pkg.files as string[];
    expect(files).toContain('catalog');
    expect(files).not.toContain('!catalog/index.json');
  });

  it('catalog/index.json is valid JSON containing an array of skills', () => {
    const raw = readFileSync(CATALOG_INDEX, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    const skills = parsed as Array<{ name: unknown }>;
    expect(skills.length).toBeGreaterThan(0);
    for (const skill of skills) {
      expect(typeof skill.name).toBe('string');
    }
  });

  it('.gitignore excludes local install targets (.opencode/ and skills/)', () => {
    const contents = readFileSync(GITIGNORE, 'utf-8');
    expect(contents).toMatch(/^\.opencode\/?\s*$/m);
    expect(contents).toMatch(/^skills\/?\s*$/m);
  });

  it('indexPath always points inside the catalog (no dist/ drift)', () => {
    const paths = resolvePaths(PROJECT_ROOT, resolve(PROJECT_ROOT, 'catalog'));
    expect(paths.indexPath.startsWith(resolve(PROJECT_ROOT, 'dist'))).toBe(false);
  });
});
