import { describe, it, expect } from 'vitest';
import { resolvePaths, getBundledSkillsDir, resolveSkillsDir } from '../paths.js';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';

describe('resolvePaths', () => {
  it('returns a complete AppPaths object with indexPath inside the skillsDir', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-shape-'));
    try {
      const paths = resolvePaths(cwd, '/bundled/catalog');
      expect(paths.skillsDir).toBe('/bundled/catalog');
      expect(paths.indexPath).toBe(join('/bundled/catalog', 'index.json'));
      expect(paths.opencode.global).toContain('.config');
      expect(paths.opencode.global).toContain('opencode');
      expect(paths.opencode.local).toBe(join(cwd, '.opencode', 'skills'));
      expect(paths.openclaw.global).toMatch(/\/\.openclaw\/skills$/);
      expect(paths.openclaw.local).toBe(join(cwd, 'skills'));
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('derives indexPath from EZSKILLS_SKILLS_DIR (env wins over bundled)', () => {
    const original = process.env['EZSKILLS_SKILLS_DIR'];
    process.env['EZSKILLS_SKILLS_DIR'] = '/custom/skills';
    try {
      const paths = resolvePaths('/cwd', '/bundled/catalog');
      expect(paths.skillsDir).toBe('/custom/skills');
      expect(paths.indexPath).toBe(join('/custom/skills', 'index.json'));
    } finally {
      if (original === undefined) delete process.env['EZSKILLS_SKILLS_DIR'];
      else process.env['EZSKILLS_SKILLS_DIR'] = original;
    }
  });

  it('ignores cwd/catalog even when it exists (no implicit fallback)', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-no-fallback-'));
    try {
      mkdirSync(join(cwd, 'catalog'));
      const paths = resolvePaths(cwd, '/bundled/catalog');
      expect(paths.skillsDir).toBe('/bundled/catalog');
      expect(paths.indexPath).toBe(join('/bundled/catalog', 'index.json'));
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('respects EZSKILLS_OPENCODE_GLOBAL override', () => {
    const original = process.env['EZSKILLS_OPENCODE_GLOBAL'];
    process.env['EZSKILLS_OPENCODE_GLOBAL'] = '/custom/oc-global';
    try {
      const paths = resolvePaths('/cwd', '/bundled/catalog');
      expect(paths.opencode.global).toBe('/custom/oc-global');
    } finally {
      if (original === undefined) delete process.env['EZSKILLS_OPENCODE_GLOBAL'];
      else process.env['EZSKILLS_OPENCODE_GLOBAL'] = original;
    }
  });

  it('uses home dir for global paths', () => {
    const paths = resolvePaths('/cwd', '/bundled/catalog');
    expect(paths.opencode.global).toMatch(/^\/home\/.*\/\.config\/opencode\/skills$/);
  });
});

describe('resolveSkillsDir fallback cascade', () => {
  it('returns env value when set, even if cwd has a catalog/', () => {
    const result = resolveSkillsDir('/cwd', '/bundled/catalog', '/from/env');
    expect(result).toBe('/from/env');
  });

  it('returns bundled catalog when env is unset, regardless of cwd', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ezskills-'));
    try {
      mkdirSync(join(tmp, 'catalog'));
      const result = resolveSkillsDir(tmp, '/bundled/catalog', undefined);
      expect(result).toBe('/bundled/catalog');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns bundled catalog when env is unset and cwd has no catalog/', () => {
    const result = resolveSkillsDir('/cwd/with/no-catalog', '/bundled/catalog', undefined);
    expect(result).toBe('/bundled/catalog');
  });

  it('ignores empty-string env and falls through to bundled', () => {
    const result = resolveSkillsDir('/cwd/with/no-catalog', '/bundled/catalog', '');
    expect(result).toBe('/bundled/catalog');
  });
});

describe('getBundledSkillsDir', () => {
  it('resolves to ../../catalog relative to the path module file (2 levels deep in the package)', () => {
    const fakeModuleFile = join('/pkg', 'dist', 'config', 'paths.js');
    const fakeUrl = pathToFileURL(fakeModuleFile).href;
    const result = getBundledSkillsDir(fakeUrl);
    expect(result).toBe(resolve('/pkg', 'catalog'));
    expect(dirname(result)).toBe('/pkg');
  });

  it('matches the source layout src/config/paths.ts (pnpm dev)', () => {
    const fakeModuleFile = join('/repo', 'src', 'config', 'paths.ts');
    const fakeUrl = pathToFileURL(fakeModuleFile).href;
    const result = getBundledSkillsDir(fakeUrl);
    expect(result).toBe(resolve('/repo', 'catalog'));
  });
});
