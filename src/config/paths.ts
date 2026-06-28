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
  return resolve(here, '..', '..', 'catalog');
}

export function resolveSkillsDir(
  _cwd: string,
  bundledSkillsDir: string,
  envValue: string | undefined,
): string {
  if (envValue && envValue.length > 0) return envValue;
  return bundledSkillsDir;
}

export function resolvePaths(
  cwd: string = process.cwd(),
  bundledSkillsDir: string = getBundledSkillsDir(),
): AppPaths {
  const home = homedir();
  const skillsDir = resolveSkillsDir(
    cwd,
    bundledSkillsDir,
    process.env['EZSKILLS_SKILLS_DIR'],
  );
  return {
    skillsDir,
    indexPath: join(skillsDir, 'index.json'),
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
