import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPackageRoot } from '../config/paths.js';

function getPackageVersion(): string {
  const pkgPath = join(getPackageRoot(), 'package.json');
  const raw = readFileSync(pkgPath, 'utf8');
  const parsed = JSON.parse(raw) as { version?: unknown };
  if (typeof parsed.version !== 'string') {
    throw new Error('package.json has no version field');
  }
  return parsed.version;
}

export function printVersion(): void {
  console.log(`ezskills ${getPackageVersion()}`);
}

export function printHelp(): void {
  console.log(`ezskills ${getPackageVersion()}

Usage: ezskills [options]

Options:
  -v, --version     Print the version and exit
  -h, --help        Print this help and exit

Run without options to launch the interactive TUI for installing and
uninstalling skills for OpenCode and OpenClaw.

Environment variables:
  EZSKILLS_SKILLS_DIR        Override the skills catalog directory
                             (default: the bundled catalog shipped with the package)
  EZSKILLS_OPENCODE_GLOBAL   OpenCode global skills dir
  EZSKILLS_OPENCODE_LOCAL    OpenCode local skills dir
  EZSKILLS_OPENCLAW_GLOBAL   OpenClaw global skills dir
  EZSKILLS_OPENCLAW_LOCAL    OpenClaw local skills dir
`);
}
