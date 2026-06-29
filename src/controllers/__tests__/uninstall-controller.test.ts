import { describe, it, expect, vi } from 'vitest';
import { UninstallController } from '../uninstall-controller.js';
import { InstalledSkillsRepository } from '../../repositories/installed-skills-repository.js';
import { InstallerService } from '../../services/installer/installer-service.js';
import type { InstalledSkill, Scope, SkillProvider } from '../../types/index.js';

function buildProvider(id: string, installed: InstalledSkill[] = []): SkillProvider {
  return {
    id,
    label: id,
    isInstalled: false,
    async getInstalledSkills(scope: Scope) {
      return installed.filter((s) => s.scope === scope);
    },
    async install() {},
    async uninstall() {},
  };
}

const SAMPLE: InstalledSkill[] = [
  { name: 'a', scope: 'global', providerId: 'opencode', path: '/a' },
  { name: 'b', scope: 'global', providerId: 'opencode', path: '/b' },
];

describe('UninstallController', () => {
  it('loadInstalled(scope) returns installed for the given scope (all providers)', async () => {
    const provider = buildProvider('opencode', SAMPLE);
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, undefined, { onBack: vi.fn(), onResult: vi.fn() });
    const list = await c.loadInstalled('global');
    expect(list).toHaveLength(2);
  });

  it('loadInstalled("local") returns no global skills', async () => {
    const provider = buildProvider('opencode', SAMPLE);
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, undefined, { onBack: vi.fn(), onResult: vi.fn() });
    const list = await c.loadInstalled('local');
    expect(list).toEqual([]);
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
    const list = await c.loadInstalled('global');
    expect(list.map((s) => s.name)).toEqual(['a']);
  });

  it('loadInstalled(scope) filters by scope when skills exist in both scopes', async () => {
    const provider = buildProvider('opencode', [
      { name: 'g1', scope: 'global', providerId: 'opencode', path: '/g1' },
      { name: 'g2', scope: 'global', providerId: 'opencode', path: '/g2' },
      { name: 'l1', scope: 'local', providerId: 'opencode', path: '/l1' },
    ]);
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, undefined, { onBack: vi.fn(), onResult: vi.fn() });

    const globalList = await c.loadInstalled('global');
    expect(globalList.map((s) => s.name).sort()).toEqual(['g1', 'g2']);

    const localList = await c.loadInstalled('local');
    expect(localList.map((s) => s.name)).toEqual(['l1']);
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

  it('does not hold scope state internally (the view owns it and passes it to loadInstalled)', () => {
    const provider = buildProvider('opencode');
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, undefined, { onBack: vi.fn(), onResult: vi.fn() });
    expect((c as unknown as { setScope?: unknown }).setScope).toBeUndefined();
    expect((c as unknown as { getScope?: unknown }).getScope).toBeUndefined();
    expect((c as unknown as { toggle?: unknown }).toggle).toBeUndefined();
    expect((c as unknown as { isSelected?: unknown }).isSelected).toBeUndefined();
    expect((c as unknown as { beginConfirm?: unknown }).beginConfirm).toBeUndefined();
    expect((c as unknown as { cancelConfirm?: unknown }).cancelConfirm).toBeUndefined();
    expect((c as unknown as { isConfirming?: unknown }).isConfirming).toBeUndefined();
  });
});
