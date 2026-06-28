import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printVersion, printHelp } from '../output.js';

describe('output', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('printVersion prints "ezskills <version>"', () => {
    printVersion();
    expect(logSpy).toHaveBeenCalledTimes(1);
    const out = logSpy.mock.calls[0]?.[0] as string;
    expect(out).toMatch(/^ezskills \d+\.\d+\.\d+$/);
  });

  it('printHelp prints usage, options, and environment variables', () => {
    printHelp();
    expect(logSpy).toHaveBeenCalled();
    const message = logSpy.mock.calls.map((c) => c[0]).join('\n') as string;
    expect(message).toContain('Usage: ezskills');
    expect(message).toContain('--version');
    expect(message).toContain('--help');
    expect(message).toContain('EZSKILLS_SKILLS_DIR');
    expect(message).toContain('EZSKILLS_OPENCODE_GLOBAL');
    expect(message).toContain('EZSKILLS_OPENCLAW_GLOBAL');
  });
});
