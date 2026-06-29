import { existsSync } from 'node:fs';

import { resolvePaths, type AppPaths } from './paths.js';
import { createFsPromisesAdapter } from './fs-promises-adapter.js';
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
  assertIndexExists(paths.indexPath);

  const fs = createFsPromisesAdapter();
  const skillRepo = new SkillRepository(paths.indexPath, fs);
  const searchService = new SearchService();

  const opencode = new OpenCodeProvider(paths.opencode, fs);
  const openclaw = new OpenClawProvider(paths.openclaw, fs);
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

function assertIndexExists(indexPath: string): void {
  if (!existsSync(indexPath)) {
    throw new Error(
      `ezskills: catalog index is missing at ${indexPath}\n` +
        `The index ships with the package and must not be regenerated at runtime.\n` +
        `If you got this from a published tarball, please report a bug.\n` +
        `If you are hacking on ezskills, run: pnpm build:index`,
    );
  }
}
