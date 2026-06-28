import { describe, it, expect, beforeEach } from 'vitest';
import { AutoDetectController } from '../auto-detect-controller.js';
import { StubDetector } from '../../services/detector/stub-detector.js';
import { SkillRepository } from '../../repositories/skill-repository.js';
import { vol } from 'memfs';
import type { FsAdapter } from '../../types/index.js';

function fs(): FsAdapter {
  return vol.promises as unknown as FsAdapter;
}

describe('AutoDetectController', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('returns empty when detector finds nothing', async () => {
    vol.reset();
    vol.fromJSON({ '/.ezskills/index.json': '[]' }, '/');
    const detector = new StubDetector();
    const repo = new SkillRepository('/.ezskills/index.json', fs());
    const c = new AutoDetectController({ detector, skillRepo: repo, cwd: '/proj' });
    const result = await c.run();
    expect(result.technologies).toEqual([]);
    expect(result.suggested).toEqual([]);
  });

  it('matches skills by technology name (case-insensitive)', async () => {
    vol.fromJSON(
      {
        '/.ezskills/index.json': JSON.stringify([
          { name: 'react', description: 'React', technologies: ['React'], path: '/skills/react' },
          { name: 'vue', description: 'Vue', technologies: ['Vue'], path: '/skills/vue' },
        ]),
      },
      '/',
    );
    const detector: { detect: (p: string) => Promise<{ technologies: string[]; suggestedSkillNames: string[] }> } = {
      async detect() {
        return { technologies: ['react'], suggestedSkillNames: [] };
      },
    };
    const repo = new SkillRepository('/.ezskills/index.json', fs());
    const c = new AutoDetectController({ detector, skillRepo: repo, cwd: '/proj' });
    const result = await c.run();
    expect(result.technologies).toEqual(['react']);
    expect(result.suggested.map((s) => s.name)).toEqual(['react']);
  });

  it('falls back to suggestedSkillNames when no tech match', async () => {
    vol.fromJSON(
      {
        '/.ezskills/index.json': JSON.stringify([
          { name: 'zod', description: 'Zod', technologies: ['Zod'], path: '/skills/zod' },
        ]),
      },
      '/',
    );
    const detector = {
      async detect() {
        return { technologies: ['unknown-tech'], suggestedSkillNames: ['zod'] };
      },
    };
    const repo = new SkillRepository('/.ezskills/index.json', fs());
    const c = new AutoDetectController({ detector, skillRepo: repo, cwd: '/proj' });
    const result = await c.run();
    expect(result.suggested.map((s) => s.name)).toEqual(['zod']);
  });
});
