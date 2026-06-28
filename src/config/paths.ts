import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AppPaths {
  skillsDir: string;
  indexPath: string;
  opencode: { global: string; local: string };
  openclaw: { global: string; local: string };
}

function envOr(key: string, fallback: string): string {
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
}

export function getBundledSkillsDir(importMetaUrl: string = import.meta.url): string {
  const here = dirname(fileURLToPath(importMetaUrl));
  return resolve(here, '..', 'catalog');
}

export function resolveSkillsDir(
  cwd: string,
  bundledSkillsDir: string,
  envValue: string | undefined,
  dirExists: (path: string) => boolean,
): string {
  if (envValue && envValue.length > 0) return envValue;
  const cwdCatalog = join(cwd, 'catalog');
  if (dirExists(cwdCatalog)) return cwdCatalog;
  return bundledSkillsDir;
}

export function resolvePaths(
  cwd: string = process.cwd(),
  bundledSkillsDir: string = getBundledSkillsDir(),
): AppPaths {
  const home = homedir();
  return {
    skillsDir: resolveSkillsDir(
      cwd,
      bundledSkillsDir,
      process.env['EZSKILLS_SKILLS_DIR'],
      (p) => existsSync(p),
    ),
    indexPath: envOr('EZSKILLS_INDEX_PATH', join(cwd, '.ezskills', 'index.json')),
    opencode: {
      global: envOr('EZSKILLS_OPENCODE_GLOBAL', join(home, '.config', 'opencode', 'skills')),
      local: envOr('EZSKILLS_OPENCODE_LOCAL', join(cwd, '.opencode', 'skills')),
    },
    openclaw: {
      global: envOr('EZSKILLS_OPENCLAW_GLOBAL', join(home, '.openclaw', 'skills')),
      local: envOr('EZSKILLS_OPENCLAW_LOCAL', join(cwd, 'skills')),
    },
  };
}
