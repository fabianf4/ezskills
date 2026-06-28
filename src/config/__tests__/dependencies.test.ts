import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { buildDependencies } from '../dependencies.js';

describe('buildDependencies', () => {
  it('creates an index file when missing and wires all dependencies', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-test-'));
    const skillsDir = join(cwd, 'catalog');
    mkdirSync(join(skillsDir, 'zod'), { recursive: true });
    writeFileSync(
      join(skillsDir, 'zod', 'SKILL.md'),
      '---\nname: zod\ndescription: Zod\n---\n# zod',
    );
    process.env['EZSKILLS_SKILLS_DIR'] = skillsDir;
    process.env['EZSKILLS_INDEX_PATH'] = join(cwd, '.ezskills', 'index.json');
    process.env['EZSKILLS_OPENCODE_GLOBAL'] = join(cwd, 'oc-global');
    process.env['EZSKILLS_OPENCODE_LOCAL'] = join(cwd, 'oc-local');
    process.env['EZSKILLS_OPENCLAW_GLOBAL'] = join(cwd, 'claw-global');
    process.env['EZSKILLS_OPENCLAW_LOCAL'] = join(cwd, 'claw-local');

    try {
      const deps = await buildDependencies(cwd);
      expect(deps.skillRepo).toBeDefined();
      expect(deps.searchService).toBeDefined();
      expect(deps.installedRepo).toBeDefined();
      expect(deps.installer).toBeDefined();
      expect(deps.providers.size).toBe(2);
      expect(deps.providers.has('opencode')).toBe(true);
      expect(deps.providers.has('openclaw')).toBe(true);
      expect(deps.listProviders).toBeDefined();
      const list = deps.listProviders();
      expect(list).toHaveLength(2);
      expect(list).toEqual(
        expect.arrayContaining([
          { id: 'opencode', label: 'OpenCode' },
          { id: 'openclaw', label: 'OpenClaw' },
        ]),
      );

      const skills = await deps.skillRepo.getAll();
      expect(skills.map((s) => s.name)).toContain('zod');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('skips index generation when index already exists', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-skip-'));
    const skillsDir = join(cwd, 'catalog');
    mkdirSync(join(skillsDir, 'react'), { recursive: true });
    writeFileSync(
      join(skillsDir, 'react', 'SKILL.md'),
      '---\nname: react\ndescription: R\n---\n# react',
    );
    const indexPath = join(cwd, '.ezskills', 'index.json');
    mkdirSync(dirname(indexPath), { recursive: true });
    writeFileSync(indexPath, JSON.stringify([{ name: 'preexisting', description: 'P', technologies: [], path: '/preexisting' }]));

    process.env['EZSKILLS_SKILLS_DIR'] = skillsDir;
    process.env['EZSKILLS_INDEX_PATH'] = indexPath;
    process.env['EZSKILLS_OPENCODE_GLOBAL'] = join(cwd, 'oc-global');
    process.env['EZSKILLS_OPENCODE_LOCAL'] = join(cwd, 'oc-local');
    process.env['EZSKILLS_OPENCLAW_GLOBAL'] = join(cwd, 'claw-global');
    process.env['EZSKILLS_OPENCLAW_LOCAL'] = join(cwd, 'claw-local');

    try {
      const deps = await buildDependencies(cwd);
      const skills = await deps.skillRepo.getAll();
      expect(skills.map((s) => s.name)).toEqual(['preexisting']);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('listInstalledProviders returns only providers whose config dir exists', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-detect-'));
    const skillsDir = join(cwd, 'catalog');
    mkdirSync(skillsDir, { recursive: true });
    process.env['EZSKILLS_SKILLS_DIR'] = skillsDir;
    process.env['EZSKILLS_INDEX_PATH'] = join(cwd, '.ezskills', 'index.json');
    process.env['EZSKILLS_OPENCODE_GLOBAL'] = join(cwd, '.config', 'opencode', 'skills');
    process.env['EZSKILLS_OPENCODE_LOCAL'] = join(cwd, '.opencode', 'skills');
    process.env['EZSKILLS_OPENCLAW_GLOBAL'] = join(cwd, '.openclaw', 'skills');
    process.env['EZSKILLS_OPENCLAW_LOCAL'] = join(cwd, 'skills');

    mkdirSync(join(cwd, '.config', 'opencode'), { recursive: true });

    try {
      const deps = await buildDependencies(cwd);
      const installed = deps.listInstalledProviders();
      expect(installed).toEqual([{ id: 'opencode', label: 'OpenCode' }]);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
