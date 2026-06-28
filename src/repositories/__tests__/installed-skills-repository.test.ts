import { describe, it, expect } from 'vitest';
import { InstalledSkillsRepository } from '../installed-skills-repository.js';
import type { InstalledSkill, SkillProvider, Scope } from '../../types/index.js';

function buildProvider(id: string, byScope: Partial<Record<Scope, InstalledSkill[]>>): SkillProvider {
  return {
    id,
    label: id,
    isInstalled: false,
    async getInstalledSkills(scope: Scope): Promise<InstalledSkill[]> {
      return byScope[scope] ?? [];
    },
    async install(): Promise<void> {},
    async uninstall(): Promise<void> {},
  };
}

describe('InstalledSkillsRepository', () => {
  it('listAll aggregates installed skills from all providers', async () => {
    const opencode = buildProvider('opencode', {
      global: [
        { name: 'zod', scope: 'global', providerId: 'opencode', path: '/g/zod' },
        { name: 'react', scope: 'global', providerId: 'opencode', path: '/g/react' },
      ],
      local: [],
    });
    const openclaw = buildProvider('openclaw', {
      global: [
        { name: 'vue', scope: 'global', providerId: 'openclaw', path: '/g/vue' },
      ],
      local: [],
    });

    const repo = new InstalledSkillsRepository([opencode, openclaw]);
    const all = await repo.listAll();
    expect(all).toHaveLength(3);
    expect(all.map((s) => s.name).sort()).toEqual(['react', 'vue', 'zod']);
  });

  it('listAll includes both scopes from all providers', async () => {
    const opencode = buildProvider('opencode', {
      global: [{ name: 'g-skill', scope: 'global', providerId: 'opencode', path: '/g/x' }],
      local: [{ name: 'l-skill', scope: 'local', providerId: 'opencode', path: '/l/x' }],
    });

    const repo = new InstalledSkillsRepository([opencode]);
    const all = await repo.listAll();
    expect(all).toHaveLength(2);
    expect(all.map((s) => s.scope).sort()).toEqual(['global', 'local']);
  });

  it('listByScope filters by scope across all providers', async () => {
    const opencode = buildProvider('opencode', {
      global: [{ name: 'g1', scope: 'global', providerId: 'opencode', path: '/g1' }],
      local: [{ name: 'l1', scope: 'local', providerId: 'opencode', path: '/l1' }],
    });
    const openclaw = buildProvider('openclaw', {
      global: [{ name: 'g2', scope: 'global', providerId: 'openclaw', path: '/g2' }],
      local: [],
    });

    const repo = new InstalledSkillsRepository([opencode, openclaw]);

    const globals = await repo.listByScope('global');
    expect(globals.map((s) => s.name).sort()).toEqual(['g1', 'g2']);

    const locals = await repo.listByScope('local');
    expect(locals.map((s) => s.name)).toEqual(['l1']);
  });

  it('listByProvider returns only skills from that provider', async () => {
    const opencode = buildProvider('opencode', {
      global: [{ name: 'g1', scope: 'global', providerId: 'opencode', path: '/g1' }],
      local: [],
    });
    const openclaw = buildProvider('openclaw', {
      global: [{ name: 'g2', scope: 'global', providerId: 'openclaw', path: '/g2' }],
      local: [],
    });

    const repo = new InstalledSkillsRepository([opencode, openclaw]);
    const oc = await repo.listByProvider('opencode');
    expect(oc.map((s) => s.name)).toEqual(['g1']);

    const ocLaw = await repo.listByProvider('openclaw');
    expect(ocLaw.map((s) => s.name)).toEqual(['g2']);
  });

  it('listByProvider returns empty for unknown provider id', async () => {
    const opencode = buildProvider('opencode', {
      global: [{ name: 'g1', scope: 'global', providerId: 'opencode', path: '/g1' }],
      local: [],
    });
    const repo = new InstalledSkillsRepository([opencode]);
    expect(await repo.listByProvider('nonexistent')).toEqual([]);
  });

  it('listByScopeAndProvider composes both filters', async () => {
    const opencode = buildProvider('opencode', {
      global: [{ name: 'oc-global', scope: 'global', providerId: 'opencode', path: '/x' }],
      local: [{ name: 'oc-local', scope: 'local', providerId: 'opencode', path: '/y' }],
    });
    const openclaw = buildProvider('openclaw', {
      global: [{ name: 'claw-global', scope: 'global', providerId: 'openclaw', path: '/z' }],
      local: [],
    });

    const repo = new InstalledSkillsRepository([opencode, openclaw]);
    const result = await repo.listByScopeAndProvider('global', 'opencode');
    expect(result.map((s) => s.name)).toEqual(['oc-global']);
  });

  it('listByScopeAndProvider returns empty for unknown provider', async () => {
    const opencode = buildProvider('opencode', {
      global: [{ name: 'a', scope: 'global', providerId: 'opencode', path: '/a' }],
      local: [],
    });
    const repo = new InstalledSkillsRepository([opencode]);
    expect(await repo.listByScopeAndProvider('global', 'unknown')).toEqual([]);
  });

  it('returns empty arrays when no providers are registered', async () => {
    const repo = new InstalledSkillsRepository([]);
    expect(await repo.listAll()).toEqual([]);
    expect(await repo.listByScope('global')).toEqual([]);
    expect(await repo.listByProvider('any')).toEqual([]);
  });

  it('preserves the providerId on each InstalledSkill item', async () => {
    const opencode = buildProvider('opencode', {
      global: [{ name: 'a', scope: 'global', providerId: 'opencode', path: '/a' }],
      local: [],
    });
    const openclaw = buildProvider('openclaw', {
      global: [{ name: 'b', scope: 'global', providerId: 'openclaw', path: '/b' }],
      local: [],
    });

    const repo = new InstalledSkillsRepository([opencode, openclaw]);
    const all = await repo.listAll();
    expect(all.find((s) => s.name === 'a')?.providerId).toBe('opencode');
    expect(all.find((s) => s.name === 'b')?.providerId).toBe('openclaw');
  });

  it('does not deduplicate: same skill in two providers appears twice', async () => {
    const dup: InstalledSkill = {
      name: 'shared',
      scope: 'global',
      providerId: 'opencode',
      path: '/oc/shared',
    };
    const opencode = buildProvider('opencode', { global: [dup], local: [] });
    const openclaw = buildProvider('openclaw', {
      global: [{ ...dup, providerId: 'openclaw', path: '/claw/shared' }],
      local: [],
    });

    const repo = new InstalledSkillsRepository([opencode, openclaw]);
    const all = await repo.listAll();
    expect(all).toHaveLength(2);
    expect(all.map((s) => s.providerId).sort()).toEqual(['openclaw', 'opencode']);
  });
});
