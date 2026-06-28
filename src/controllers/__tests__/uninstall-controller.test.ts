import { describe, it, expect, vi } from 'vitest';
import { UninstallController } from '../uninstall-controller.js';
import { InstalledSkillsRepository } from '../../repositories/installed-skills-repository.js';
import { InstallerService } from '../../services/installer/installer-service.js';
import type { InstalledSkill, SkillProvider } from '../../types/index.js';

function buildProvider(id: string, installed: InstalledSkill[] = []): SkillProvider {
  return {
    id,
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
  it('loadInstalled returns installed for current scope', async () => {
    const provider = buildProvider('opencode', SAMPLE);
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, { onBack: vi.fn(), onResult: vi.fn() });
    const list = await c.loadInstalled();
    expect(list).toHaveLength(2);
  });

  it('setScope updates scope', () => {
    const provider = buildProvider('opencode');
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, { onBack: vi.fn(), onResult: vi.fn() });
    c.setScope('local');
    expect(c.getScope()).toBe('local');
  });

  it('toggle and isSelected', () => {
    const provider = buildProvider('opencode');
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, { onBack: vi.fn(), onResult: vi.fn() });
    c.toggle('a');
    expect(c.isSelected('a')).toBe(true);
  });

  it('beginConfirm and cancelConfirm', () => {
    const provider = buildProvider('opencode');
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, { onBack: vi.fn(), onResult: vi.fn() });
    c.beginConfirm();
    expect(c.isConfirming()).toBe(true);
    c.cancelConfirm();
    expect(c.isConfirming()).toBe(false);
  });

  it('confirm with no selection cancels', async () => {
    const provider = buildProvider('opencode', SAMPLE);
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const c = new UninstallController(repo, installer, { onBack: vi.fn(), onResult: vi.fn() });
    await c.confirm();
    expect(c.isConfirming()).toBe(false);
  });

  it('confirm with selection uninstalls and calls onResult', async () => {
    const provider = buildProvider('opencode', SAMPLE);
    const uninstallSpy = vi.spyOn(provider, 'uninstall');
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const onResult = vi.fn();
    const c = new UninstallController(repo, installer, { onBack: vi.fn(), onResult });
    c.toggle('a');
    c.beginConfirm();
    await c.confirm();
    expect(uninstallSpy).toHaveBeenCalled();
    expect(onResult).toHaveBeenCalled();
    expect(c.isConfirming()).toBe(false);
  });

  it('back calls onBack', () => {
    const provider = buildProvider('opencode');
    const repo = new InstalledSkillsRepository([provider]);
    const installer = new InstallerService(new Map([['opencode', provider]]), repo);
    const onBack = vi.fn();
    const c = new UninstallController(repo, installer, { onBack, onResult: vi.fn() });
    c.back();
    expect(onBack).toHaveBeenCalled();
  });
});
