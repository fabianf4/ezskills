import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';
import { InstallerService } from '../installer-service.js';
import { InstalledSkillsRepository } from '../../../repositories/installed-skills-repository.js';
import type {
  IndexedSkill,
  InstalledSkill,
  Scope,
  SkillProvider,
} from '../../../types/index.js';

function buildProvider(
  id: string,
  overrides: Partial<Pick<SkillProvider, 'install' | 'uninstall' | 'getInstalledSkills'>> = {},
): SkillProvider {
  return {
    id,
    async getInstalledSkills(): Promise<InstalledSkill[]> {
      return [];
    },
    async install(): Promise<void> {},
    async uninstall(): Promise<void> {},
    ...overrides,
  };
}

function buildRepo(providers: SkillProvider[]): InstalledSkillsRepository {
  return new InstalledSkillsRepository(providers);
}

const SKILL_A: IndexedSkill = { name: 'a', description: 'A', technologies: [], path: '/src/a' };
const SKILL_B: IndexedSkill = { name: 'b', description: 'B', technologies: [], path: '/src/b' };
const SKILL_C: IndexedSkill = { name: 'c', description: 'C', technologies: [], path: '/src/c' };

describe('InstallerService', () => {
  it('installs a single skill using the specified provider', async () => {
    const install = vi.fn().mockResolvedValue(undefined);
    const provider = buildProvider('opencode', { install });
    const service = new InstallerService(
      new Map([['opencode', provider]]),
      buildRepo([provider]),
    );

    const result = await service.installMany([SKILL_A], 'global', 'opencode');

    expect(install).toHaveBeenCalledWith(SKILL_A, 'global');
    expect(result.installed).toEqual(['a']);
    expect(result.failed).toEqual([]);
  });

  it('installs multiple skills in order', async () => {
    const install = vi.fn().mockResolvedValue(undefined);
    const provider = buildProvider('opencode', { install });
    const service = new InstallerService(
      new Map([['opencode', provider]]),
      buildRepo([provider]),
    );

    const result = await service.installMany([SKILL_A, SKILL_B, SKILL_C], 'global', 'opencode');

    expect(install).toHaveBeenCalledTimes(3);
    expect(install.mock.calls[0]).toEqual([SKILL_A, 'global']);
    expect(install.mock.calls[1]).toEqual([SKILL_B, 'global']);
    expect(install.mock.calls[2]).toEqual([SKILL_C, 'global']);
    expect(result.installed).toEqual(['a', 'b', 'c']);
  });

  it('throws when the providerId is unknown', async () => {
    const service = new InstallerService(new Map(), buildRepo([]));
    await expect(service.installMany([SKILL_A], 'global', 'unknown')).rejects.toThrow(
      /unknown provider/i,
    );
  });

  it('skips skills that are already installed (does not call provider)', async () => {
    const install = vi.fn().mockResolvedValue(undefined);
    const provider = buildProvider('opencode', {
      install,
      async getInstalledSkills(): Promise<InstalledSkill[]> {
        return [
          { name: 'a', scope: 'global', providerId: 'opencode', path: '/dst/a' },
        ];
      },
    });
    const service = new InstallerService(
      new Map([['opencode', provider]]),
      buildRepo([provider]),
    );

    const result = await service.installMany([SKILL_A, SKILL_B], 'global', 'opencode');

    expect(install).toHaveBeenCalledTimes(1);
    expect(install).toHaveBeenCalledWith(SKILL_B, 'global');
    expect(result.installed).toEqual(['b']);
    expect(result.skipped).toEqual(['a']);
  });

  it('does not skip a skill installed in a different scope', async () => {
    const install = vi.fn().mockResolvedValue(undefined);
    const provider = buildProvider('opencode', {
      install,
      async getInstalledSkills(scope: Scope): Promise<InstalledSkill[]> {
        if (scope === 'local') {
          return [{ name: 'a', scope: 'local', providerId: 'opencode', path: '/dst/a' }];
        }
        return [];
      },
    });
    const service = new InstallerService(
      new Map([['opencode', provider]]),
      buildRepo([provider]),
    );

    const result = await service.installMany([SKILL_A], 'global', 'opencode');

    expect(install).toHaveBeenCalledWith(SKILL_A, 'global');
    expect(result.installed).toEqual(['a']);
  });

  it('reports failures without aborting the batch (no rollback)', async () => {
    const install = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('disk full'))
      .mockResolvedValueOnce(undefined);
    const provider = buildProvider('opencode', { install });
    const service = new InstallerService(
      new Map([['opencode', provider]]),
      buildRepo([provider]),
    );

    const result = await service.installMany([SKILL_A, SKILL_B, SKILL_C], 'global', 'opencode');

    expect(result.installed).toEqual(['a', 'c']);
    expect(result.failed).toEqual([{ name: 'b', error: 'disk full' }]);
  });

  it('uninstalls each skill using its own provider', async () => {
    const opencodeUninstall = vi.fn().mockResolvedValue(undefined);
    const openclawUninstall = vi.fn().mockResolvedValue(undefined);
    const opencode = buildProvider('opencode', { uninstall: opencodeUninstall });
    const openclaw = buildProvider('openclaw', { uninstall: openclawUninstall });
    const service = new InstallerService(
      new Map([
        ['opencode', opencode],
        ['openclaw', openclaw],
      ]),
      buildRepo([opencode, openclaw]),
    );

    const result = await service.uninstallMany([
      { name: 'a', scope: 'global', providerId: 'opencode', path: '/a' },
      { name: 'b', scope: 'global', providerId: 'openclaw', path: '/b' },
    ]);

    expect(opencodeUninstall).toHaveBeenCalledTimes(1);
    expect(openclawUninstall).toHaveBeenCalledTimes(1);
    expect(result.uninstalled).toEqual(['a', 'b']);
  });

  it('uninstall reports failures but continues with the rest', async () => {
    const opencodeUninstall = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('not found'));
    const provider = buildProvider('opencode', { uninstall: opencodeUninstall });
    const service = new InstallerService(
      new Map([['opencode', provider]]),
      buildRepo([provider]),
    );

    const result = await service.uninstallMany([
      { name: 'a', scope: 'global', providerId: 'opencode', path: '/a' },
      { name: 'b', scope: 'global', providerId: 'opencode', path: '/b' },
    ]);

    expect(result.uninstalled).toEqual(['a']);
    expect(result.failed).toEqual([{ name: 'b', error: 'not found' }]);
  });

  it('uninstall reports an error when the provider is not registered', async () => {
    const service = new InstallerService(new Map(), buildRepo([]));
    const result = await service.uninstallMany([
      { name: 'a', scope: 'global', providerId: 'unknown', path: '/a' },
    ]);
    expect(result.uninstalled).toEqual([]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.name).toBe('a');
  });

  it('installMany with empty array returns empty result', async () => {
    const provider = buildProvider('opencode');
    const service = new InstallerService(
      new Map([['opencode', provider]]),
      buildRepo([provider]),
    );
    const result = await service.installMany([], 'global', 'opencode');
    expect(result).toEqual({ installed: [], skipped: [], failed: [] });
  });
});
