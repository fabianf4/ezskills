import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, copyFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..');
const BUNDLE = resolve(PROJECT_ROOT, 'dist', 'index.js');
const PACKAGE_JSON = resolve(PROJECT_ROOT, 'package.json');

function bundleExists(): boolean {
  return existsSync(BUNDLE);
}

describe('bundle (dist/index.js)', () => {
  it('does not exist when no build has run (this test is the build contract)', () => {
    if (!bundleExists()) {
      expect.fail(
        'dist/index.js is missing. Run `pnpm build` to create the self-contained bundle. ' +
          'This test enforces that the build is the source of truth for the runtime binary.',
      );
    }
    expect(bundleExists()).toBe(true);
  });

  it('is self-contained: contains no imports of external npm packages', () => {
    if (!bundleExists()) return;
    const contents = readFileSync(BUNDLE, 'utf-8');
    const externalImportPattern =
      /from\s+['"](?!node:|\.\/)[a-z@][^'"\s./]+['"]/i;
    const matches = contents.match(new RegExp(externalImportPattern.source, 'gi'));
    expect(matches ?? []).toEqual([]);
  });

  it('does not import from src/services/indexer/ (the dev-only index builder)', () => {
    if (!bundleExists()) return;
    const contents = readFileSync(BUNDLE, 'utf-8');
    expect(contents).not.toMatch(/skill-?indexer/i);
    expect(contents).not.toMatch(/frontmatter-parser/i);
  });

  it('runs `node <bundle> --version` without node_modules adjacent', () => {
    if (!bundleExists()) return;
    const tmp = join(tmpdir(), `ezskills-bundle-${Date.now()}-${process.pid}`);
    mkdirSync(tmp, { recursive: true });
    try {
      mkdirSync(join(tmp, 'dist'), { recursive: true });
      copyFileSync(BUNDLE, join(tmp, 'dist', 'index.js'));
      copyFileSync(BUNDLE + '.map', join(tmp, 'dist', 'index.js.map'));
      mkdirSync(join(tmp, 'catalog'), { recursive: true });
      copyFileSync(PACKAGE_JSON, join(tmp, 'package.json'));
      expect(existsSync(join(tmp, 'node_modules'))).toBe(false);
      const stdout = execFileSync('node', [join(tmp, 'dist', 'index.js'), '--version'], {
        cwd: tmp,
        encoding: 'utf-8',
      });
      expect(stdout).toMatch(/ezskills\s+\d+\.\d+\.\d+/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('runs `node <bundle> --help` without node_modules adjacent', () => {
    if (!bundleExists()) return;
    const tmp = join(tmpdir(), `ezskills-help-${Date.now()}-${process.pid}`);
    mkdirSync(tmp, { recursive: true });
    try {
      mkdirSync(join(tmp, 'dist'), { recursive: true });
      copyFileSync(BUNDLE, join(tmp, 'dist', 'index.js'));
      copyFileSync(BUNDLE + '.map', join(tmp, 'dist', 'index.js.map'));
      mkdirSync(join(tmp, 'catalog'), { recursive: true });
      copyFileSync(PACKAGE_JSON, join(tmp, 'package.json'));
      const stdout = execFileSync('node', [join(tmp, 'dist', 'index.js'), '--help'], {
        cwd: tmp,
        encoding: 'utf-8',
      });
      expect(stdout).toContain('Usage: ezskills [options]');
      expect(stdout).toContain('-v, --version');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('bundle size is reasonable (< 5 MB) and is executable', () => {
    if (!bundleExists()) return;
    const stat = statSync(BUNDLE);
    expect(stat.size).toBeGreaterThan(100_000);
    expect(stat.size).toBeLessThan(5_000_000);
    const mode = stat.mode;
    expect(mode & 0o111).not.toBe(0);
  });
});
