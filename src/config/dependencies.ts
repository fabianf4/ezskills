import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { resolvePaths, type AppPaths } from './paths.js';
import { SkillIndexer } from '../services/indexer/skill-indexer.js';
import { SkillRepository } from '../repositories/skill-repository.js';
import { InstalledSkillsRepository } from '../repositories/installed-skills-repository.js';
import { OpenCodeProvider } from '../services/providers/opencode-provider.js';
import { OpenClawProvider } from '../services/providers/openclaw-provider.js';
import { InstallerService } from '../services/installer/installer-service.js';
import { SearchService } from '../services/search/search-service.js';
import type { ProviderListItem, SkillProvider } from '../types/index.js';

export interface AppDependencies {
  paths: AppPaths;
  skillRepo: SkillRepository;
  searchService: SearchService;
  installedRepo: InstalledSkillsRepository;
  installer: InstallerService;
  providers: Map<string, SkillProvider>;
  listProviders: () => ProviderListItem[];
  listInstalledProviders: () => ProviderListItem[];
}

export async function buildDependencies(cwd: string = process.cwd()): Promise<AppDependencies> {
  const paths = resolvePaths(cwd);
  await ensureIndexFile(paths);

  const skillRepo = new SkillRepository(paths.indexPath, fsPromisesAdapter());
  const searchService = new SearchService();

  const opencode = new OpenCodeProvider(paths.opencode, fsPromisesAdapter());
  const openclaw = new OpenClawProvider(paths.openclaw, fsPromisesAdapter());
  const providers = new Map<string, SkillProvider>([
    [opencode.id, opencode],
    [openclaw.id, openclaw],
  ]);

  const installedRepo = new InstalledSkillsRepository([opencode, openclaw]);
  const installer = new InstallerService(providers, installedRepo);

  const listProviders = (): ProviderListItem[] =>
    Array.from(providers.values()).map((p) => ({ id: p.id, label: p.label }));

  const listInstalledProviders = (): ProviderListItem[] =>
    Array.from(providers.values())
      .filter((p) => p.isInstalled)
      .map((p) => ({ id: p.id, label: p.label }));

  return {
    paths,
    skillRepo,
    searchService,
    installedRepo,
    installer,
    providers,
    listProviders,
    listInstalledProviders,
  };
}

async function ensureIndexFile(paths: AppPaths): Promise<void> {
  if (existsSync(paths.indexPath)) {
    return;
  }
  const indexer = new SkillIndexer({
    skillsDir: paths.skillsDir,
    indexPath: paths.indexPath,
    fs: fsPromisesAdapter(),
  });
  await indexer.run();
}

function fsPromisesAdapter() {
  return {
    readdir: (p: string, opts: { withFileTypes: true }) =>
      import('node:fs/promises').then((m) => m.readdir(p, opts)),
    readFile: (p: string, enc: 'utf-8') =>
      import('node:fs/promises').then((m) => m.readFile(p, enc)),
    stat: (p: string) => import('node:fs/promises').then((m) => m.stat(p)),
    mkdir: (p: string, opts: { recursive: boolean }) =>
      import('node:fs/promises').then((m) => m.mkdir(p, opts)),
    writeFile: (p: string, c: string) =>
      import('node:fs/promises').then((m) => m.writeFile(p, c)),
    cp: (s: string, d: string, opts: { recursive: boolean }) =>
      import('node:fs/promises').then((m) => m.cp(s, d, opts)),
    rm: (p: string, opts: { recursive: boolean; force: boolean }) =>
      import('node:fs/promises').then((m) => m.rm(p, opts)),
    existsSync,
  };
}

export { mkdir, writeFile, dirname };
