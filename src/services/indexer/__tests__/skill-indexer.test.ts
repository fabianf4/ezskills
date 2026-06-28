import { describe, it, expect, beforeEach } from 'vitest';
import { vol } from 'memfs';
import { SkillIndexer } from '../skill-indexer.js';
import type { FsAdapter } from '../../../types/index.js';

function buildMemFs(): FsAdapter {
  return vol.promises as unknown as FsAdapter;
}

describe('SkillIndexer', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns an empty array when skills dir does not exist', async () => {
    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });
    const result = await indexer.run();
    expect(result).toEqual([]);
  });

  it('builds an index from a single valid skill folder', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---
# Zod`,
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result).toEqual([
      {
        name: 'zod',
        description: 'Zod schema validation',
        technologies: [],
        path: '/skills/zod',
      },
    ]);
  });

  it('builds an index with multiple valid skills', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---`,
        '/skills/react/SKILL.md': `---
name: react
description: React UI library
---`,
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.name).sort()).toEqual(['react', 'zod']);
  });

  it('merges metadata.json technology into technologies array', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---`,
        '/skills/zod/metadata.json': JSON.stringify({
          technology: 'Zod',
          category: 'API',
        }),
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result[0]?.technologies).toContain('Zod');
  });

  it('keeps technologies empty when metadata.json is absent', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---`,
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result[0]?.technologies).toEqual([]);
  });

  it('skips entries that are not directories (e.g. loose files)', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---`,
        '/skills/README.md': '# Skills index, not a skill',
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('zod');
  });

  it('skips folders that have no SKILL.md', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---`,
        '/skills/orphan/file.txt': 'no SKILL.md here',
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('zod');
  });

  it('skips folders whose SKILL.md has no valid frontmatter', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
---`,
        '/skills/broken/SKILL.md': '# No frontmatter at all',
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result.map((s) => s.name)).toEqual(['zod']);
  });

  it('writes the index to indexPath as JSON', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---`,
      },
      '/',
    );

    const fs = buildMemFs();
    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs,
    });

    await indexer.run();
    const written = vol.readFileSync('/.ezskills/index.json', 'utf-8') as string;
    const parsed = JSON.parse(written);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]?.name).toBe('zod');
  });

  it('creates parent directories of indexPath if missing', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---`,
      },
      '/',
    );

    const fs = buildMemFs();
    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs,
    });

    await indexer.run();
    expect(vol.existsSync('/.ezskills')).toBe(true);
  });

  it('uses folder name as path', async () => {
    vol.fromJSON(
      {
        '/skills/my-skill/SKILL.md': `---
name: my-skill
description: some skill
---`,
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result[0]?.path).toBe('/skills/my-skill');
  });

  it('handles invalid metadata.json gracefully (treats as no metadata)', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---`,
        '/skills/zod/metadata.json': 'not valid json {',
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result[0]?.technologies).toEqual([]);
  });

  it('aggregates multiple technology entries from metadata.json categories', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---`,
        '/skills/zod/metadata.json': JSON.stringify({
          technology: 'Zod',
          category: 'Schema',
        }),
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result[0]?.technologies).toEqual(expect.arrayContaining(['Zod', 'Schema']));
  });

  it('treats metadata.json that is a non-object JSON value as no metadata', async () => {
    vol.fromJSON(
      {
        '/skills/zod/SKILL.md': `---
name: zod
description: Zod schema validation
---`,
        '/skills/zod/metadata.json': '"just-a-string"',
      },
      '/',
    );

    const indexer = new SkillIndexer({
      skillsDir: '/skills',
      indexPath: '/.ezskills/index.json',
      fs: buildMemFs(),
    });

    const result = await indexer.run();
    expect(result[0]?.technologies).toEqual([]);
  });
});
