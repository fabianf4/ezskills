import { describe, it, expect, vi } from 'vitest';
import { UninstallController } from '../uninstall-controller.js';
import { InstalledSkillsRepository } from '../../repositories/installed-skills-repository.js';
import { InstallerService } from '../../services/installer/installer-service.js';
import type { InstalledSkill, SkillProvider } from '../../types/index.js';

function buildProvider(id: string, installed: InstalledSkill[] = []): SkillProvider {
  return {
    id,
    label: id,
    isInstalled: false,
    async getInstalledSkills() { return installed; },
    async install() {},
    async uninstall() {},
  };
}

const SAMPLE: InstalledSkill[] = [
  { name: 'a', scope: 'global', providerId: 'opencode', path: '/a' },
  { name: 'b', scope: 'global', providerId: 'opencode', path: '/b' },
];

describe('UninstallController', () => {
  it('loadInstalled returns installed for current scope (all providers)', async () => {
    const provider = buildProvider('opencode', SAMPLE);
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, undefined, { onBack: vi.fn(), onResult: vi.fn() });
    const list = await c.loadInstalled();
    expect(list).toHaveLength(2);
  });

  it('loadInstalled filters by providerIds when given', async () => {
    const opencode = buildProvider('opencode', [
      { name: 'a', scope: 'global', providerId: 'opencode', path: '/a' },
    ]);
    const openclaw = buildProvider('openclaw', [
      { name: 'b', scope: 'global', providerId: 'openclaw', path: '/b' },
    ]);
    const repo = new InstalledSkillsRepository([opencode, openclaw]);
    const installer = new InstallerService(
      new Map([['opencode', opencode], ['openclaw', openclaw]]),
      repo,
    );
    const c = new UninstallController(
      repo,
      installer,
      new Set(['opencode']),
      { onBack: vi.fn(), onResult: vi.fn() },
    );
    const list = await c.loadInstalled();
    expect(list.map((s) => s.name)).toEqual(['a']);
  });

  it('setScope updates scope', () => {
    const provider = buildProvider('opencode');
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, undefined, { onBack: vi.fn(), onResult: vi.fn() });
    c.setScope('local');
    expect(c.getScope()).toBe('local');
  });

  it('back calls onBack', () => {
    const provider = buildProvider('opencode');
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const onBack = vi.fn();
    const c = new UninstallController(repo, installer, undefined, { onBack, onResult: vi.fn() });
    c.back();
    expect(onBack).toHaveBeenCalled();
  });

  it('confirm(skills) uninstalls the given list directly (no internal toggle state)', async () => {
    const provider = buildProvider('opencode', SAMPLE);
    const uninstallSpy = vi.spyOn(provider, 'uninstall');
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const onResult = vi.fn();
    const c = new UninstallController(repo, installer, undefined, { onBack: vi.fn(), onResult });

    await c.confirm([SAMPLE[0]!, SAMPLE[1]!]);

    expect(uninstallSpy).toHaveBeenCalledTimes(2);
    expect(uninstallSpy).toHaveBeenNthCalledWith(1, SAMPLE[0]);
    expect(uninstallSpy).toHaveBeenNthCalledWith(2, SAMPLE[1]);
    expect(onResult).toHaveBeenCalledTimes(1);
    const result = onResult.mock.calls[0]?.[0] as { uninstalled: string[]; failed: unknown[] };
    expect(result.uninstalled.sort()).toEqual(['a', 'b']);
    expect(result.failed).toEqual([]);
  });

  it('confirm([]) is a no-op (does not call onResult)', async () => {
    const provider = buildProvider('opencode', SAMPLE);
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const onResult = vi.fn();
    const c = new UninstallController(repo, installer, undefined, { onBack: vi.fn(), onResult });
    await c.confirm([]);
    expect(onResult).not.toHaveBeenCalled();
  });

  it('does not expose toggle/isSelected/beginConfirm (the view owns the selection)', () => {
    const provider = buildProvider('opencode');
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, undefined, { onBack: vi.fn(), onResult: vi.fn() });
    expect((c as unknown as { toggle?: unknown }).toggle).toBeUndefined();
    expect((c as unknown as { isSelected?: unknown }).isSelected).toBeUndefined();
    expect((c as unknown as { beginConfirm?: unknown }).beginConfirm).toBeUndefined();
    expect((c as unknown as { cancelConfirm?: unknown }).cancelConfirm).toBeUndefined();
    expect((c as unknown as { isConfirming?: unknown }).isConfirming).toBeUndefined();
  });
});
