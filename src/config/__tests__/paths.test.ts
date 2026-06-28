import { describe, it, expect } from 'vitest';
import { resolvePaths, getBundledSkillsDir, resolveSkillsDir } from '../paths.js';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';

describe('resolvePaths', () => {
  it('returns a complete AppPaths object', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-shape-'));
    try {
      mkdirSync(join(cwd, 'catalog'));
      const paths = resolvePaths(cwd, '/unused-bundled');
      expect(paths.skillsDir).toBe(join(cwd, 'catalog'));
      expect(paths.indexPath).toBe(join(cwd, '.ezskills', 'index.json'));
      expect(paths.opencode.global).toContain('.config');
      expect(paths.opencode.global).toContain('opencode');
      expect(paths.opencode.local).toBe(join(cwd, '.opencode', 'skills'));
      expect(paths.openclaw.global).toMatch(/\/\.openclaw\/skills$/);
      expect(paths.openclaw.local).toBe(join(cwd, 'skills'));
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('respects environment variable overrides', () => {
    const original = process.env['EZSKILLS_SKILLS_DIR'];
    process.env['EZSKILLS_SKILLS_DIR'] = '/custom/skills';
    try {
      const paths = resolvePaths('/cwd');
      expect(paths.skillsDir).toBe('/custom/skills');
    } finally {
      if (original === undefined) delete process.env['EZSKILLS_SKILLS_DIR'];
      else process.env['EZSKILLS_SKILLS_DIR'] = original;
    }
  });

  it('respects EZSKILLS_OPENCODE_GLOBAL override', () => {
    const original = process.env['EZSKILLS_OPENCODE_GLOBAL'];
    process.env['EZSKILLS_OPENCODE_GLOBAL'] = '/custom/oc-global';
    try {
      const paths = resolvePaths('/cwd');
      expect(paths.opencode.global).toBe('/custom/oc-global');
    } finally {
      if (original === undefined) delete process.env['EZSKILLS_OPENCODE_GLOBAL'];
      else process.env['EZSKILLS_OPENCODE_GLOBAL'] = original;
    }
  });

  it('uses home dir for global paths', () => {
    const paths = resolvePaths('/cwd');
    expect(paths.opencode.global).toMatch(/^\/home\/.*\/\.config\/opencode\/skills$/);
  });
});

describe('resolveSkillsDir fallback cascade', () => {
  it('returns env value when set, even if cwd has a catalog/', () => {
    const result = resolveSkillsDir('/cwd', '/bundled/catalog', '/from/env', () => true);
    expect(result).toBe('/from/env');
  });

  it('returns cwd catalog when env is unset and the directory exists', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ezskills-'));
    try {
      mkdirSync(join(tmp, 'catalog'));
      const result = resolveSkillsDir(tmp, '/bundled/catalog', undefined, (p) => p === join(tmp, 'catalog'));
      expect(result).toBe(join(tmp, 'catalog'));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns bundled catalog when env is unset and cwd has no catalog/', () => {
    const result = resolveSkillsDir('/cwd/with/no-catalog', '/bundled/catalog', undefined, () => false);
    expect(result).toBe('/bundled/catalog');
  });

  it('ignores empty-string env and falls through to cwd/bundled', () => {
    const result = resolveSkillsDir('/cwd/with/no-catalog', '/bundled/catalog', '', () => false);
    expect(result).toBe('/bundled/catalog');
  });
});

describe('getBundledSkillsDir', () => {
  it('resolves to ../catalog relative to the dist directory of the import', () => {
    const fakeDistFile = join('/pkg', 'dist', 'index.js');
    const fakeUrl = pathToFileURL(fakeDistFile).href;
    const result = getBundledSkillsDir(fakeUrl);
    expect(result).toBe(resolve('/pkg', 'catalog'));
    expect(dirname(result)).toBe('/pkg');
  });
});
