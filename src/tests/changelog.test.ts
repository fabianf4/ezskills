import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..');
const CHANGELOG = resolve(PROJECT_ROOT, 'CHANGELOG.md');
const PACKAGE_JSON = resolve(PROJECT_ROOT, 'package.json');

function getEntry(version: string): string {
  const changelog = readFileSync(CHANGELOG, 'utf-8');
  const lines = changelog.split('\n');
  const header = `## ${version}`;
  const startIdx = lines.findIndex((l) => l.startsWith(header));
  if (startIdx === -1) throw new Error(`No entry for ${version} in CHANGELOG.md`);
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i]!.startsWith('## ')) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(startIdx, endIdx).join('\n');
}

describe('changelog and package version', () => {
  it('package.json version is 0.3.0', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf-8')) as { version?: string };
    expect(pkg.version).toBe('0.3.0');
  });

  it('changelog has a 0.3.0 entry dated 2026-06-28', () => {
    const changelog = readFileSync(CHANGELOG, 'utf-8');
    expect(changelog).toMatch(/^## 0\.3\.0 \(2026-06-28\)/m);
  });

  it('0.3.0 entry documents the self-contained bundle (esbuild)', () => {
    const entry = getEntry('0.3.0');
    expect(entry).toMatch(/esbuild/i);
    expect(entry).toMatch(/self-contained/i);
  });

  it('0.3.0 entry documents that index.json is committed and never written at runtime', () => {
    const entry = getEntry('0.3.0');
    expect(entry).toContain('committed to the repo');
    expect(entry).toContain('`pnpm build:index`');
    expect(entry).toMatch(/never.*runtime|never created.*modified.*deleted/i);
  });

  it('0.3.0 entry documents the new build:index script', () => {
    const entry = getEntry('0.3.0');
    expect(entry).toContain('`pnpm build:index`');
    expect(entry).toContain('scripts/build-index.ts');
  });

  it('changelog has a 0.2.0 entry dated 2026-06-28', () => {
    const changelog = readFileSync(CHANGELOG, 'utf-8');
    expect(changelog).toMatch(/^## 0\.2\.0 \(2026-06-28\)/m);
  });

  it('0.2.0 entry is structured with Behavior/Internal/Credits sections', () => {
    const entry = getEntry('0.2.0');
    expect(entry).toMatch(/### Behavior changes/);
    expect(entry).toMatch(/### Internal/);
    expect(entry).toMatch(/### Credits/);
  });

  it('0.2.0 entry credits midudev/autoskills', () => {
    const entry = getEntry('0.2.0');
    expect(entry).toContain('https://github.com/midudev/autoskills');
  });

  it('0.2.0 entry documents the new <catalog>/index.json location', () => {
    const entry = getEntry('0.2.0');
    expect(entry).toContain('<catalog>/index.json');
  });

  it('0.2.0 entry documents the removed <cwd>/catalog fallback', () => {
    const entry = getEntry('0.2.0');
    expect(entry).toContain('`<cwd>/catalog` fallback');
  });

  it('0.2.0 entry documents the removed EZSKILLS_INDEX_PATH', () => {
    const entry = getEntry('0.2.0');
    expect(entry).toContain('`EZSKILLS_INDEX_PATH`');
  });

  it('0.2.0 entry does not present the removed env var as the current default', () => {
    const entry = getEntry('0.2.0');
    expect(entry).not.toMatch(/default:.*EZSKILLS_INDEX_PATH/i);
    expect(entry).not.toMatch(/EZSKILLS_INDEX_PATH.*default/i);
  });

  it('0.2.0 entry mentions the 264 tests / 99.68% coverage stats', () => {
    const entry = getEntry('0.2.0');
    expect(entry).toContain('264 tests');
    expect(entry).toContain('99,68%');
  });

  it('0.1.0 entry is preserved as the historical record of the initial release', () => {
    const entry = getEntry('0.1.0');
    expect(entry).toContain('Initial release');
    expect(entry).toContain('OpenCode');
    expect(entry).toContain('OpenClaw');
  });
});
