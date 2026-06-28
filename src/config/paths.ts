import { homedir } from 'node:os';
import { join } from 'node:path';

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

export function resolvePaths(cwd: string = process.cwd()): AppPaths {
  const home = homedir();
  return {
    skillsDir: envOr('EZSKILLS_SKILLS_DIR', join(cwd, 'catalog')),
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
