import { describe, it, expect, vi } from 'vitest';
import { InstallController } from '../install-controller.js';
import { SkillRepository } from '../../repositories/skill-repository.js';
import { InstalledSkillsRepository } from '../../repositories/installed-skills-repository.js';
import { InstallerService } from '../../services/installer/installer-service.js';
import { vol } from 'memfs';
import type { FsAdapter, IndexedSkill, InstalledSkill, SkillProvider } from '../../types/index.js';

function fs(): FsAdapter {
  return vol.promises as unknown as FsAdapter;
}

function buildProvider(
  id: string,
  installed: InstalledSkill[] = [],
): SkillProvider {
  return {
    id,
    async getInstalledSkills() { return installed; },
    async install() {},
    async uninstall() {},
  };
}

const SKILL: IndexedSkill = { name: 'zod', description: 'Z', technologies: [], path: '/src/zod' };

describe('InstallController', () => {
  it('loadAvailable returns all skills from repo', async () => {
    vol.fromJSON({ '/idx.json': JSON.stringify([SKILL]) }, '/');
    const repo = new SkillRepository('/idx.json', fs());
    const provider = buildProvider('opencode');
    const installedRepo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), installedRepo);
    const c = new InstallController(repo, installedRepo, installer, 'opencode', {
      onBack: vi.fn(),
      onResult: vi.fn(),
      onError: vi.fn(),
    });

    const list = await c.loadAvailable();
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe('zod');
  });

  it('loadInstalledNames returns set of installed names', async () => {
    const provider = buildProvider('opencode', [
      { name: 'a', scope: 'global', providerId: 'opencode', path: '/a' },
    ]);
    const installedRepo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), installedRepo);
    const c = new InstallController(
      {} as SkillRepository,
      installedRepo,
      installer,
      'opencode',
      { onBack: vi.fn(), onResult: vi.fn(), onError: vi.fn() },
    );

    const names = await c.loadInstalledNames();
    expect(names.has('a')).toBe(true);
  });

  it('setScope and getScope', () => {
    const c = new InstallController(
      {} as SkillRepository,
      {} as InstalledSkillsRepository,
      {} as InstallerService,
      'opencode',
      { onBack: vi.fn(), onResult: vi.fn(), onError: vi.fn() },
    );
    c.setScope('local');
    expect(c.getScope()).toBe('local');
  });

  it('toggle and isSelected', () => {
    const c = new InstallController(
      {} as SkillRepository,
      {} as InstalledSkillsRepository,
      {} as InstallerService,
      'opencode',
      { onBack: vi.fn(), onResult: vi.fn(), onError: vi.fn() },
    );
    c.toggle('zod');
    expect(c.isSelected('zod')).toBe(true);
    c.toggle('zod');
    expect(c.isSelected('zod')).toBe(false);
  });

  it('filter uses internal state query', () => {
    const c = new InstallController(
      {} as SkillRepository,
      {} as InstalledSkillsRepository,
      {} as InstallerService,
      'opencode',
      { onBack: vi.fn(), onResult: vi.fn(), onError: vi.fn() },
    );
    c.setQuery('zod');
    const filtered = c.filter([SKILL, { name: 'react', description: 'r', technologies: [], path: '/r' }]);
    expect(filtered.map((s) => s.name)).toEqual(['zod']);
  });

  it('confirm with empty skills calls onError', async () => {
    const onError = vi.fn();
    const c = new InstallController(
      {} as SkillRepository,
      {} as InstalledSkillsRepository,
      {} as InstallerService,
      'opencode',
      { onBack: vi.fn(), onResult: vi.fn(), onError },
    );
    await c.confirm([]);
    expect(onError).toHaveBeenCalledWith('No skills selected');
  });

  it('confirm calls installer and onResult', async () => {
    vol.fromJSON({ '/idx.json': '[]' }, '/');
    const repo = new SkillRepository('/idx.json', fs());
    const provider = buildProvider('opencode');
    const installedRepo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), installedRepo);
    const installSpy = vi.spyOn(provider, 'install');
    const onResult = vi.fn();
    const c = new InstallController(repo, installedRepo, installer, 'opencode', {
      onBack: vi.fn(),
      onResult,
      onError: vi.fn(),
    });
    await c.confirm([SKILL]);
    expect(installSpy).toHaveBeenCalledWith(SKILL, 'local');
    expect(onResult).toHaveBeenCalled();
  });

  it('confirm with installer per-skill failure calls onResult with failure', async () => {
    const provider: SkillProvider = {
      id: 'opencode',
      async getInstalledSkills() { return []; },
      async install() { throw new Error('boom'); },
      async uninstall() {},
    };
    const installedRepo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), installedRepo);
    const onResult = vi.fn();
    const c = new InstallController(
      {} as SkillRepository,
      installedRepo,
      installer,
      'opencode',
      { onBack: vi.fn(), onResult, onError: vi.fn() },
    );
    await c.confirm([SKILL]);
    expect(onResult).toHaveBeenCalled();
    const result = onResult.mock.calls[0]?.[0] as { failed: Array<{ name: string; error: string }> };
    expect(result.failed[0]?.error).toBe('boom');
  });

  it('confirm with installer throw calls onError', async () => {
    const provider = buildProvider('opencode');
    const installedRepo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), installedRepo);
    const spy = vi.spyOn(installer, 'installMany').mockRejectedValue(new Error('total-fail'));
    const onError = vi.fn();
    const c = new InstallController(
      {} as SkillRepository,
      installedRepo,
      installer,
      'opencode',
      { onBack: vi.fn(), onResult: vi.fn(), onError },
    );
    await c.confirm([SKILL]);
    expect(spy).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('total-fail');
  });

  it('back calls onBack', () => {
    const onBack = vi.fn();
    const c = new InstallController(
      {} as SkillRepository,
      {} as InstalledSkillsRepository,
      {} as InstallerService,
      'opencode',
      { onBack, onResult: vi.fn(), onError: vi.fn() },
    );
    c.back();
    expect(onBack).toHaveBeenCalled();
  });
});
