import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('smoke', () => {
  it('node fs is available', () => {
    expect(typeof existsSync).toBe('function');
  });

  it('vitest is configured', () => {
    expect(1 + 1).toBe(2);
  });

  it('catalog directory exists relative to project', () => {
    const catalogPath = resolve(process.cwd(), 'catalog');
    expect(existsSync(catalogPath)).toBe(true);
  });
});
