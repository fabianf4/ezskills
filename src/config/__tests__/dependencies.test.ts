import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildDependencies } from '../dependencies.js';

describe('buildDependencies', () => {
  it('throws with actionable error when catalog index is missing (no auto-generation)', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-test-'));
    const skillsDir = join(cwd, 'catalog');
    mkdirSync(join(skillsDir, 'zod'), { recursive: true });
    writeFileSync(
      join(skillsDir, 'zod', 'SKILL.md'),
      '---\nname: zod\ndescription: Zod\n---\n# zod',
    );
    process.env['EZSKILLS_SKILLS_DIR'] = skillsDir;
    process.env['EZSKILLS_OPENCODE_GLOBAL'] = join(cwd, 'oc-global');
    process.env['EZSKILLS_OPENCODE_LOCAL'] = join(cwd, 'oc-local');
    process.env['EZSKILLS_OPENCLAW_GLOBAL'] = join(cwd, 'claw-global');
    process.env['EZSKILLS_OPENCLAW_LOCAL'] = join(cwd, 'claw-local');

    try {
      await expect(buildDependencies(cwd)).rejects.toThrow(/catalog index is missing/);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('loads skills from existing index.json without auto-generating', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-skip-'));
    const skillsDir = join(cwd, 'catalog');
    mkdirSync(join(skillsDir, 'react'), { recursive: true });
    writeFileSync(
      join(skillsDir, 'react', 'SKILL.md'),
      '---\nname: react\ndescription: R\n---\n# react',
    );
    const indexPath = join(skillsDir, 'index.json');
    writeFileSync(
      indexPath,
      JSON.stringify([{ name: 'preexisting', description: 'P', technologies: [], path: '/preexisting' }]),
    );

    process.env['EZSKILLS_SKILLS_DIR'] = skillsDir;
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
    writeFileSync(join(skillsDir, 'index.json'), '[]');
    process.env['EZSKILLS_SKILLS_DIR'] = skillsDir;
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
