import { describe, it, expect } from 'vitest';
import { resolvePaths } from '../paths.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('resolvePaths', () => {
  it('returns a complete AppPaths object', () => {
    const cwd = tmpdir();
    const paths = resolvePaths(cwd);
    expect(paths.skillsDir).toBe(join(cwd, 'catalog'));
    expect(paths.indexPath).toBe(join(cwd, '.ezskills', 'index.json'));
    expect(paths.opencode.global).toContain('.config');
    expect(paths.opencode.global).toContain('opencode');
    expect(paths.opencode.local).toBe(join(cwd, '.opencode', 'skills'));
    expect(paths.openclaw.global).toMatch(/\/\.openclaw\/skills$/);
    expect(paths.openclaw.local).toBe(join(cwd, 'skills'));
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
