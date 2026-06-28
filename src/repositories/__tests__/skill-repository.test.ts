import { describe, it, expect, beforeEach, vi } from 'vitest';
import { vol } from 'memfs';
import { SkillRepository } from '../skill-repository.js';
import type { FsAdapter } from '../../types/index.js';

function buildMemFs(): FsAdapter {
  return vol.promises as unknown as FsAdapter;
}

const SAMPLE_INDEX = JSON.stringify(
  [
    {
      name: 'zod',
      description: 'Zod schema validation',
      technologies: ['Zod', 'Schema'],
      path: '/skills/zod',
    },
    {
      name: 'react',
      description: 'React UI library',
      technologies: ['React', 'Frontend'],
      path: '/skills/react',
    },
    {
      name: 'next',
      description: 'Next.js framework',
      technologies: ['Next.js', 'React'],
      path: '/skills/next',
    },
  ],
  null,
  2,
);

describe('SkillRepository', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('loads the index from disk on first call', async () => {
    vol.fromJSON({ '/.ezskills/index.json': SAMPLE_INDEX }, '/');
    const repo = new SkillRepository('/.ezskills/index.json', buildMemFs());

    const all = await repo.getAll();
    expect(all).toHaveLength(3);
    expect(all[0]?.name).toBe('zod');
  });

  it('caches the index: subsequent getAll does not re-read', async () => {
    vol.fromJSON({ '/.ezskills/index.json': SAMPLE_INDEX }, '/');
    const fs = buildMemFs();
    const spy = vi.spyOn(fs, 'readFile');

    const repo = new SkillRepository('/.ezskills/index.json', fs);
    await repo.getAll();
    await repo.getAll();
    await repo.getAll();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('getAll returns a defensive copy (mutations do not affect cache)', async () => {
    vol.fromJSON({ '/.ezskills/index.json': SAMPLE_INDEX }, '/');
    const repo = new SkillRepository('/.ezskills/index.json', buildMemFs());

    const first = await repo.getAll();
    first.pop();

    const second = await repo.getAll();
    expect(second).toHaveLength(3);
  });

  it('getByName returns the matching skill', async () => {
    vol.fromJSON({ '/.ezskills/index.json': SAMPLE_INDEX }, '/');
    const repo = new SkillRepository('/.ezskills/index.json', buildMemFs());

    const found = await repo.getByName('react');
    expect(found?.name).toBe('react');
    expect(found?.description).toBe('React UI library');
  });

  it('getByName is case-sensitive (exact match)', async () => {
    vol.fromJSON({ '/.ezskills/index.json': SAMPLE_INDEX }, '/');
    const repo = new SkillRepository('/.ezskills/index.json', buildMemFs());

    const found = await repo.getByName('React');
    expect(found).toBeNull();
  });

  it('getByName returns null for unknown name', async () => {
    vol.fromJSON({ '/.ezskills/index.json': SAMPLE_INDEX }, '/');
    const repo = new SkillRepository('/.ezskills/index.json', buildMemFs());

    expect(await repo.getByName('unknown')).toBeNull();
  });

  it('getByTechnology filters skills that include the tech', async () => {
    vol.fromJSON({ '/.ezskills/index.json': SAMPLE_INDEX }, '/');
    const repo = new SkillRepository('/.ezskills/index.json', buildMemFs());

    const reactSkills = await repo.getByTechnology('React');
    expect(reactSkills.map((s) => s.name).sort()).toEqual(['next', 'react']);
  });

  it('getByTechnology returns empty for unknown tech', async () => {
    vol.fromJSON({ '/.ezskills/index.json': SAMPLE_INDEX }, '/');
    const repo = new SkillRepository('/.ezskills/index.json', buildMemFs());

    expect(await repo.getByTechnology('COBOL')).toEqual([]);
  });

  it('invalidate forces re-read on next call', async () => {
    vol.fromJSON({ '/.ezskills/index.json': SAMPLE_INDEX }, '/');
    const fs = buildMemFs();
    const spy = vi.spyOn(fs, 'readFile');

    const repo = new SkillRepository('/.ezskills/index.json', fs);
    await repo.getAll();
    repo.invalidate();
    await repo.getAll();

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('throws a descriptive error when the index file is missing', async () => {
    const repo = new SkillRepository('/.ezskills/missing.json', buildMemFs());
    await expect(repo.getAll()).rejects.toThrow(/index/i);
  });

  it('throws a descriptive error when the index file is invalid JSON', async () => {
    vol.fromJSON({ '/.ezskills/index.json': '{not valid' }, '/');
    const repo = new SkillRepository('/.ezskills/index.json', buildMemFs());
    await expect(repo.getAll()).rejects.toThrow();
  });

  it('throws when the JSON root is not an array', async () => {
    vol.fromJSON({ '/.ezskills/index.json': '{"name":"oops"}' }, '/');
    const repo = new SkillRepository('/.ezskills/index.json', buildMemFs());
    await expect(repo.getAll()).rejects.toThrow();
  });

  it('skips items in the array that are not valid IndexedSkill', async () => {
    const mixed = JSON.stringify([
      { name: 'ok', description: 'd', technologies: [], path: '/skills/ok' },
      { name: 'bad' },
      'not an object',
      { name: 'ok2', description: 'd2', technologies: [], path: '/skills/ok2' },
    ]);
    vol.fromJSON({ '/.ezskills/index.json': mixed }, '/');
    const repo = new SkillRepository('/.ezskills/index.json', buildMemFs());

    const all = await repo.getAll();
    expect(all.map((s) => s.name).sort()).toEqual(['ok', 'ok2']);
  });
});
