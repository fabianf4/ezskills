import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { OpenClawProvider } from '../openclaw-provider.js';
import type { FsAdapter, IndexedSkill } from '../../../types/index.js';

function buildMemFs(): FsAdapter {
  return vol.promises as unknown as FsAdapter;
}

const PATHS = {
  global: '/home/user/.openclaw/skills',
  local: '/home/user/project/skills',
};

const SAMPLE_SKILL: IndexedSkill = {
  name: 'zod',
  description: 'Zod schema validation',
  technologies: ['Zod'],
  path: '/source/skills/zod',
};

describe('OpenClawProvider', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('id is "openclaw"', () => {
    const provider = new OpenClawProvider(PATHS, buildMemFs());
    expect(provider.id).toBe('openclaw');
  });

  it('install copies the skill folder to the global OpenClaw target', async () => {
    vol.fromJSON({ '/source/skills/zod/SKILL.md': 'content' }, '/');
    const provider = new OpenClawProvider(PATHS, buildMemFs());

    await provider.install(SAMPLE_SKILL, 'global');

    expect(vol.existsSync('/home/user/.openclaw/skills/zod/SKILL.md')).toBe(true);
  });

  it('install copies the skill folder to the local OpenClaw target', async () => {
    vol.fromJSON({ '/source/skills/zod/SKILL.md': 'content' }, '/');
    const provider = new OpenClawProvider(PATHS, buildMemFs());

    await provider.install(SAMPLE_SKILL, 'local');

    expect(vol.existsSync('/home/user/project/skills/zod/SKILL.md')).toBe(true);
  });

  it('install throws if destination already exists', async () => {
    vol.fromJSON(
      {
        '/source/skills/zod/SKILL.md': 'new',
        '/home/user/.openclaw/skills/zod/SKILL.md': 'old',
      },
      '/',
    );
    const provider = new OpenClawProvider(PATHS, buildMemFs());

    await expect(provider.install(SAMPLE_SKILL, 'global')).rejects.toThrow(/exists|already/i);
  });

  it('uninstall removes the installed skill directory', async () => {
    vol.fromJSON(
      {
        '/home/user/.openclaw/skills/zod/SKILL.md': 'x',
        '/home/user/.openclaw/skills/react/SKILL.md': 'x',
      },
      '/',
    );
    const provider = new OpenClawProvider(PATHS, buildMemFs());

    await provider.uninstall({
      name: 'zod',
      scope: 'global',
      providerId: 'openclaw',
      path: '/home/user/.openclaw/skills/zod',
    });

    expect(vol.existsSync('/home/user/.openclaw/skills/zod')).toBe(false);
    expect(vol.existsSync('/home/user/.openclaw/skills/react')).toBe(true);
  });

  it('uninstall throws if path does not exist', async () => {
    const provider = new OpenClawProvider(PATHS, buildMemFs());
    await expect(
      provider.uninstall({
        name: 'nope',
        scope: 'global',
        providerId: 'openclaw',
        path: '/home/user/.openclaw/skills/nope',
      }),
    ).rejects.toThrow(/not found|does not exist/i);
  });

  it('getInstalledSkills("global") returns OpenClaw global skills', async () => {
    vol.fromJSON(
      {
        '/home/user/.openclaw/skills/zod/SKILL.md': 'x',
      },
      '/',
    );
    const provider = new OpenClawProvider(PATHS, buildMemFs());

    const installed = await provider.getInstalledSkills('global');
    expect(installed).toHaveLength(1);
    expect(installed[0]?.name).toBe('zod');
    expect(installed[0]?.providerId).toBe('openclaw');
    expect(installed[0]?.scope).toBe('global');
  });

  it('getInstalledSkills("local") returns OpenClaw local skills', async () => {
    vol.fromJSON(
      {
        '/home/user/project/skills/vue/SKILL.md': 'x',
      },
      '/',
    );
    const provider = new OpenClawProvider(PATHS, buildMemFs());

    const installed = await provider.getInstalledSkills('local');
    expect(installed[0]?.name).toBe('vue');
    expect(installed[0]?.scope).toBe('local');
  });

  it('uses OpenClaw paths (not OpenCode) for install', async () => {
    const opencodePaths = {
      global: '/home/user/.config/opencode/skills',
      local: '/home/user/project/.opencode/skills',
    };
    const openclawPaths = {
      global: '/home/user/.openclaw/skills',
      local: '/home/user/project/skills',
    };
    vol.fromJSON({ '/source/skills/zod/SKILL.md': 'x' }, '/');

    const opencode = new (await import('../opencode-provider.js')).OpenCodeProvider(
      opencodePaths,
      buildMemFs(),
    );
    const openclaw = new OpenClawProvider(openclawPaths, buildMemFs());

    await opencode.install(SAMPLE_SKILL, 'global');
    await openclaw.install(SAMPLE_SKILL, 'global');

    expect(vol.existsSync('/home/user/.config/opencode/skills/zod/SKILL.md')).toBe(true);
    expect(vol.existsSync('/home/user/.openclaw/skills/zod/SKILL.md')).toBe(true);
  });
});
