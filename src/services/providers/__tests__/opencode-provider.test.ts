import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { OpenCodeProvider } from '../opencode-provider.js';
import type { FsAdapter, IndexedSkill } from '../../../types/index.js';

function buildMemFs(): FsAdapter {
  return { ...vol.promises, existsSync: (p: string) => vol.existsSync(p) } as unknown as FsAdapter;
}

const PATHS = {
  global: '/home/user/.config/opencode/skills',
  local: '/home/user/project/.opencode/skills',
};

const SAMPLE_SKILL: IndexedSkill = {
  name: 'zod',
  description: 'Zod schema validation',
  technologies: ['Zod'],
  path: '/source/skills/zod',
};

describe('OpenCodeProvider', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('id is "opencode"', () => {
    const provider = new OpenCodeProvider(PATHS, buildMemFs());
    expect(provider.id).toBe('opencode');
  });

  it('label is "OpenCode"', () => {
    const provider = new OpenCodeProvider(PATHS, buildMemFs());
    expect(provider.label).toBe('OpenCode');
  });

  it('isInstalled is true when ~/.config/opencode/ exists', () => {
    vol.fromJSON({ '/home/user/.config/opencode/.keep': '' }, '/');
    const provider = new OpenCodeProvider(PATHS, buildMemFs());
    expect(provider.isInstalled).toBe(true);
  });

  it('isInstalled is false when ~/.config/opencode/ is missing', () => {
    const provider = new OpenCodeProvider(PATHS, buildMemFs());
    expect(provider.isInstalled).toBe(false);
  });

  it('install copies the skill folder recursively to the global target', async () => {
    vol.fromJSON(
      {
        '/source/skills/zod/SKILL.md': '---\nname: zod\ndescription: Z\n---\n# zod',
        '/source/skills/zod/metadata.json': '{"technology":"Zod"}',
      },
      '/',
    );
    const provider = new OpenCodeProvider(PATHS, buildMemFs());

    await provider.install(SAMPLE_SKILL, 'global');

    expect(vol.existsSync('/home/user/.config/opencode/skills/zod/SKILL.md')).toBe(true);
    expect(vol.existsSync('/home/user/.config/opencode/skills/zod/metadata.json')).toBe(true);
  });

  it('install copies the skill folder recursively to the local target', async () => {
    vol.fromJSON(
      { '/source/skills/zod/SKILL.md': 'content' },
      '/',
    );
    const provider = new OpenCodeProvider(PATHS, buildMemFs());

    await provider.install(SAMPLE_SKILL, 'local');

    expect(vol.existsSync('/home/user/project/.opencode/skills/zod/SKILL.md')).toBe(true);
  });

  it('install throws if the destination already exists (no overwrite)', async () => {
    vol.fromJSON(
      {
        '/source/skills/zod/SKILL.md': 'new content',
        '/home/user/.config/opencode/skills/zod/SKILL.md': 'old content',
      },
      '/',
    );
    const provider = new OpenCodeProvider(PATHS, buildMemFs());

    await expect(provider.install(SAMPLE_SKILL, 'global')).rejects.toThrow(/exists|already/i);
  });

  it('install creates the parent destination directory if missing', async () => {
    vol.fromJSON({ '/source/skills/zod/SKILL.md': 'x' }, '/');
    const provider = new OpenCodeProvider(PATHS, buildMemFs());

    await provider.install(SAMPLE_SKILL, 'global');

    expect(vol.existsSync('/home/user/.config/opencode/skills')).toBe(true);
  });

  it('uninstall removes the installed skill directory', async () => {
    vol.fromJSON(
      {
        '/home/user/.config/opencode/skills/zod/SKILL.md': 'content',
        '/home/user/.config/opencode/skills/react/SKILL.md': 'other',
      },
      '/',
    );
    const provider = new OpenCodeProvider(PATHS, buildMemFs());

    await provider.uninstall({
      name: 'zod',
      scope: 'global',
      providerId: 'opencode',
      path: '/home/user/.config/opencode/skills/zod',
    });

    expect(vol.existsSync('/home/user/.config/opencode/skills/zod')).toBe(false);
    expect(vol.existsSync('/home/user/.config/opencode/skills/react')).toBe(true);
  });

  it('uninstall throws if the skill directory does not exist', async () => {
    const provider = new OpenCodeProvider(PATHS, buildMemFs());

    await expect(
      provider.uninstall({
        name: 'nope',
        scope: 'global',
        providerId: 'opencode',
        path: '/home/user/.config/opencode/skills/nope',
      }),
    ).rejects.toThrow(/not found|does not exist/i);
  });

  it('getInstalledSkills("global") returns skills in the global dir', async () => {
    vol.fromJSON(
      {
        '/home/user/.config/opencode/skills/zod/SKILL.md': 'x',
        '/home/user/.config/opencode/skills/react/SKILL.md': 'x',
      },
      '/',
    );
    const provider = new OpenCodeProvider(PATHS, buildMemFs());

    const installed = await provider.getInstalledSkills('global');
    expect(installed).toHaveLength(2);
    expect(installed.map((s) => s.name).sort()).toEqual(['react', 'zod']);
    expect(installed.every((s) => s.scope === 'global')).toBe(true);
    expect(installed.every((s) => s.providerId === 'opencode')).toBe(true);
  });

  it('getInstalledSkills("local") returns skills in the local dir', async () => {
    vol.fromJSON(
      {
        '/home/user/project/.opencode/skills/vue/SKILL.md': 'x',
      },
      '/',
    );
    const provider = new OpenCodeProvider(PATHS, buildMemFs());

    const installed = await provider.getInstalledSkills('local');
    expect(installed).toHaveLength(1);
    expect(installed[0]?.name).toBe('vue');
    expect(installed[0]?.scope).toBe('local');
    expect(installed[0]?.path).toBe('/home/user/project/.opencode/skills/vue');
  });

  it('getInstalledSkills returns empty when the dir does not exist', async () => {
    const provider = new OpenCodeProvider(PATHS, buildMemFs());
    expect(await provider.getInstalledSkills('global')).toEqual([]);
    expect(await provider.getInstalledSkills('local')).toEqual([]);
  });

  it('getInstalledSkills ignores loose files (only counts directories)', async () => {
    vol.fromJSON(
      {
        '/home/user/.config/opencode/skills/zod/SKILL.md': 'x',
        '/home/user/.config/opencode/skills/loose.txt': 'not a skill',
      },
      '/',
    );
    const provider = new OpenCodeProvider(PATHS, buildMemFs());
    const installed = await provider.getInstalledSkills('global');
    expect(installed.map((s) => s.name)).toEqual(['zod']);
  });

  it('uses the paths provided in the constructor (no hardcoded defaults)', async () => {
    const customPaths = {
      global: '/custom/opencode/skills',
      local: '/custom/project/opencode',
    };
    vol.fromJSON({ '/source/skills/zod/SKILL.md': 'x' }, '/');
    const provider = new OpenCodeProvider(customPaths, buildMemFs());

    await provider.install(SAMPLE_SKILL, 'global');
    expect(vol.existsSync('/custom/opencode/skills/zod/SKILL.md')).toBe(true);
  });
});
