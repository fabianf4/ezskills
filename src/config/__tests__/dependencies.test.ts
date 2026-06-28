import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
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
      expect(deps.detector).toBeDefined();

      const skills = await deps.skillRepo.getAll();
      expect(skills.map((s) => s.name)).toContain('zod');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
