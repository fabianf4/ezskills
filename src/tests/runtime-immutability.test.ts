import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..');
const SRC_DIR = resolve(PROJECT_ROOT, 'src');

const RUNTIME_DIRS = [
  resolve(SRC_DIR, 'index.ts'),
  resolve(SRC_DIR, 'app.tsx'),
  resolve(SRC_DIR, 'cli'),
  resolve(SRC_DIR, 'config'),
  resolve(SRC_DIR, 'controllers'),
  resolve(SRC_DIR, 'models'),
  resolve(SRC_DIR, 'repositories'),
  resolve(SRC_DIR, 'services', 'installer'),
  resolve(SRC_DIR, 'services', 'providers'),
  resolve(SRC_DIR, 'services', 'search'),
  resolve(SRC_DIR, 'types'),
  resolve(SRC_DIR, 'views'),
];

const INDEXER_DIR = resolve(SRC_DIR, 'services', 'indexer');

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  const stat = statSync(dir);
  if (stat.isFile()) {
    if (/\.(ts|tsx)$/.test(dir) && !/\.(test|spec)\.tsx?$/.test(dir)) {
      out.push(dir);
    }
    return out;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    out.push(...listSourceFiles(join(dir, entry.name)));
  }
  return out;
}

describe('runtime immutability', () => {
  it('runtime code (everything outside services/indexer/) must not import from services/indexer/', () => {
    const runtimeFiles = RUNTIME_DIRS.flatMap((p) => listSourceFiles(p));
    const indexerRel = relative(SRC_DIR, INDEXER_DIR).replaceAll('\\', '/');
    const indexerImportPattern = new RegExp(
      `from\\s+['"](?:\\.\\./)+${indexerRel}/[^'"]+['"]`,
    );

    const offenders: Array<{ file: string; line: number; text: string }> = [];
    for (const file of runtimeFiles) {
      const contents = readFileSync(file, 'utf-8');
      const lines = contents.split('\n');
      lines.forEach((line, i) => {
        if (indexerImportPattern.test(line)) {
          offenders.push({
            file: relative(PROJECT_ROOT, file),
            line: i + 1,
            text: line.trim(),
          });
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  it('runtime code must not call SkillIndexer.run() (it would create catalog/index.json)', () => {
    const runtimeFiles = RUNTIME_DIRS.flatMap((p) => listSourceFiles(p));
    const offenders: string[] = [];
    for (const file of runtimeFiles) {
      const contents = readFileSync(file, 'utf-8');
      if (/\.run\s*\(/.test(contents) && /SkillIndexer/.test(contents)) {
        offenders.push(relative(PROJECT_ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('runtime code must not write to catalog/index.json (no path containing catalog/index.json on the LHS of a write)', () => {
    const runtimeFiles = RUNTIME_DIRS.flatMap((p) => listSourceFiles(p));
    const offenders: string[] = [];
    const writePattern = /writeFile|writeFileSync|persist/i;
    const indexPathPattern = /catalog\/index\.json|catalog.*index.*\.json|indexPath/i;
    for (const file of runtimeFiles) {
      const contents = readFileSync(file, 'utf-8');
      if (writePattern.test(contents) && indexPathPattern.test(contents)) {
        offenders.push(relative(PROJECT_ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
