import { describe, it, expect } from 'vitest';
import { parseArgs } from '../args.js';

describe('parseArgs', () => {
  it('returns run when no args are provided', () => {
    expect(parseArgs([])).toEqual({ kind: 'run' });
  });

  it('recognizes --version', () => {
    expect(parseArgs(['--version'])).toEqual({ kind: 'version' });
  });

  it('recognizes -v as version', () => {
    expect(parseArgs(['-v'])).toEqual({ kind: 'version' });
  });

  it('recognizes --help', () => {
    expect(parseArgs(['--help'])).toEqual({ kind: 'help' });
  });

  it('recognizes -h as help', () => {
    expect(parseArgs(['-h'])).toEqual({ kind: 'help' });
  });

  it('returns error for an unknown option', () => {
    expect(parseArgs(['--unknown'])).toEqual({
      kind: 'error',
      text: 'Unknown option: --unknown',
    });
  });

  it('takes the first flag and ignores the rest', () => {
    expect(parseArgs(['--version', '--help'])).toEqual({ kind: 'version' });
  });
});
