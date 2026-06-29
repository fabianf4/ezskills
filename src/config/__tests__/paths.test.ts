import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolvePaths,
  getBundledSkillsDir,
  resolveSkillsDir,
  getPackageRoot,
  resetPackageRootCache,
} from '../paths.js';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';

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

describe('getPackageRoot', () => {
  beforeEach(() => {
    resetPackageRootCache();
  });

  it('resolves to the parent of the bundled entry (dist/index.js -> dist/ -> package root)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ezskills-pkgroot-bundle-'));
    try {
      mkdirSync(join(tmp, 'dist'), { recursive: true });
      writeFileSync(join(tmp, 'package.json'), '{}');
      const fakeModuleFile = join(tmp, 'dist', 'index.js');
      const fakeUrl = pathToFileURL(fakeModuleFile).href;
      expect(getPackageRoot(fakeUrl)).toBe(tmp);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('resolves to the parent of src/index.ts (pnpm dev)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ezskills-pkgroot-src-'));
    try {
      mkdirSync(join(tmp, 'src'), { recursive: true });
      writeFileSync(join(tmp, 'package.json'), '{}');
      const fakeModuleFile = join(tmp, 'src', 'index.ts');
      const fakeUrl = pathToFileURL(fakeModuleFile).href;
      expect(getPackageRoot(fakeUrl)).toBe(tmp);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('falls back to walking up when parent has no package.json', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ezskills-pkgroot-walk-'));
    try {
      mkdirSync(join(tmp, 'src', 'config'), { recursive: true });
      writeFileSync(join(tmp, 'package.json'), '{}');
      const fakeModuleFile = join(tmp, 'src', 'config', 'paths.ts');
      const fakeUrl = pathToFileURL(fakeModuleFile).href;
      expect(getPackageRoot(fakeUrl)).toBe(tmp);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('getBundledSkillsDir', () => {
  beforeEach(() => {
    resetPackageRootCache();
  });

  it('resolves to ../catalog relative to the bundled entry (dist/index.js)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ezskills-catalog-bundle-'));
    try {
      mkdirSync(join(tmp, 'dist'), { recursive: true });
      writeFileSync(join(tmp, 'package.json'), '{}');
      const fakeModuleFile = join(tmp, 'dist', 'index.js');
      const fakeUrl = pathToFileURL(fakeModuleFile).href;
      const result = getBundledSkillsDir(fakeUrl);
      expect(result).toBe(resolve(tmp, 'catalog'));
      expect(dirname(result)).toBe(tmp);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('matches the source layout src/index.ts (pnpm dev)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ezskills-catalog-src-'));
    try {
      mkdirSync(join(tmp, 'src'), { recursive: true });
      writeFileSync(join(tmp, 'package.json'), '{}');
      const fakeModuleFile = join(tmp, 'src', 'index.ts');
      const fakeUrl = pathToFileURL(fakeModuleFile).href;
      const result = getBundledSkillsDir(fakeUrl);
      expect(result).toBe(resolve(tmp, 'catalog'));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('getPackageRoot default argument', () => {
  let originalCwd: string;

  beforeEach(() => {
    resetPackageRootCache();
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    resetPackageRootCache();
  });

  it('uses import.meta.url when called with no arguments (not process.cwd())', () => {
    const root = getPackageRoot();
    expect(typeof root).toBe('string');
    expect(existsSync(join(root, 'package.json'))).toBe(true);
  });

  it('default-argument root is an ancestor of the calling module, regardless of cwd', () => {
    const root = getPackageRoot();
    const callerDir = dirname(fileURLToPath(import.meta.url));
    expect(callerDir.startsWith(root)).toBe(true);
  });

  it('returns the same root when called from a foreign cwd (e.g. /tmp)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ezskills-foreign-cwd-'));
    try {
      process.chdir(tmp);
      resetPackageRootCache();
      const root = getPackageRoot();
      const callerDir = dirname(fileURLToPath(import.meta.url));
      expect(callerDir.startsWith(root)).toBe(true);
      expect(root).not.toBe(tmp);
      expect(root).not.toBe(dirname(tmp));
    } finally {
      process.chdir(originalCwd);
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
