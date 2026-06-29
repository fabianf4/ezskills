import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
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

let cachedPackageRoot: string | null = null;

export function resetPackageRootCache(): void {
  cachedPackageRoot = null;
}

export function getPackageRoot(importMetaUrl: string = import.meta.url): string {
  if (cachedPackageRoot !== null) return cachedPackageRoot;
  const start = dirname(fileURLToPath(importMetaUrl));
  const parent = resolve(start, '..');
  if (existsSync(join(parent, 'package.json'))) {
    cachedPackageRoot = parent;
    return parent;
  }
  let current = start;
  while (true) {
    if (existsSync(join(current, 'package.json'))) {
      cachedPackageRoot = current;
      return current;
    }
    const next = dirname(current);
    if (next === current) break;
    current = next;
  }
  cachedPackageRoot = parent;
  return parent;
}

export function getBundledSkillsDir(importMetaUrl?: string): string {
  return resolve(getPackageRoot(importMetaUrl), 'catalog');
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
