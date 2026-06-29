import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildIndex } from '../build-index.js';

describe('buildIndex (dev tool, pnpm build:index)', () => {
  it('writes a valid index.json to the catalog dir', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-build-'));
    const skillsDir = join(cwd, 'catalog');
    mkdirSync(join(skillsDir, 'react'), { recursive: true });
    writeFileSync(
      join(skillsDir, 'react', 'SKILL.md'),
      '---\nname: react\ndescription: React UI library\n---\n# react',
    );
    mkdirSync(join(skillsDir, 'zod'), { recursive: true });
    writeFileSync(
      join(skillsDir, 'zod', 'SKILL.md'),
      '---\nname: zod\ndescription: Zod schema validation\n---\n# zod',
    );

    try {
      const skills = await buildIndex({ skillsDir });
      expect(skills.map((s) => s.name).sort()).toEqual(['react', 'zod']);

      const indexPath = join(skillsDir, 'index.json');
      const raw = readFileSync(indexPath, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      expect(Array.isArray(parsed)).toBe(true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('respects an explicit indexPath override', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-build-override-'));
    const skillsDir = join(cwd, 'catalog');
    mkdirSync(join(skillsDir, 'vue'), { recursive: true });
    writeFileSync(
      join(skillsDir, 'vue', 'SKILL.md'),
      '---\nname: vue\ndescription: Vue framework\n---\n# vue',
    );
    const customIndex = join(cwd, 'custom', 'idx.json');

    try {
      const skills = await buildIndex({ skillsDir, indexPath: customIndex });
      expect(skills).toHaveLength(1);
      expect(skills[0]?.name).toBe('vue');
      const raw = readFileSync(customIndex, 'utf-8');
      expect(JSON.parse(raw)).toHaveLength(1);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('returns empty array and writes empty index for empty catalog', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ezskills-build-empty-'));
    const skillsDir = join(cwd, 'catalog');
    mkdirSync(skillsDir, { recursive: true });

    try {
      const skills = await buildIndex({ skillsDir });
      expect(skills).toEqual([]);
      const raw = readFileSync(join(skillsDir, 'index.json'), 'utf-8');
      expect(JSON.parse(raw)).toEqual([]);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
