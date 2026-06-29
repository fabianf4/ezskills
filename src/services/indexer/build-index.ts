import { resolve } from 'node:path';
import { SkillIndexer } from './skill-indexer.js';
import { createFsPromisesAdapter } from '../../config/fs-promises-adapter.js';
import type { IndexedSkill } from '../../types/index.js';

export interface BuildIndexOptions {
  skillsDir: string;
  indexPath?: string;
}

export async function buildIndex(options: BuildIndexOptions): Promise<IndexedSkill[]> {
  const fs = createFsPromisesAdapter();
  const indexPath = options.indexPath ?? resolve(options.skillsDir, 'index.json');
  const indexer = new SkillIndexer({
    skillsDir: options.skillsDir,
    indexPath,
    fs,
  });
  return indexer.run();
}
