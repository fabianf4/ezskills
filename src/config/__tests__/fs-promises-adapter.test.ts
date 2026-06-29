import { describe, it, expect } from 'vitest';
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { createFsPromisesAdapter } from '../fs-promises-adapter.js';

describe('createFsPromisesAdapter', () => {
  it('exposes the real node:fs/promises functions (no dynamic import wrapper)', () => {
    const adapter = createFsPromisesAdapter();
    expect(adapter.readdir).toBe(readdir);
    expect(adapter.readFile).toBe(readFile);
    expect(adapter.stat).toBe(stat);
    expect(adapter.mkdir).toBe(mkdir);
    expect(adapter.writeFile).toBe(writeFile);
    expect(adapter.cp).toBe(cp);
    expect(adapter.rm).toBe(rm);
  });

  it('exposes node:fs existsSync for synchronous probing', () => {
    const adapter = createFsPromisesAdapter();
    expect(typeof adapter.existsSync).toBe('function');
  });
});
