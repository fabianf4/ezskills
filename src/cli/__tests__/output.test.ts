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

  it('printHelp does not list the removed EZSKILLS_INDEX_PATH env var', () => {
    printHelp();
    const message = logSpy.mock.calls.map((c) => c[0]).join('\n') as string;
    expect(message).not.toContain('EZSKILLS_INDEX_PATH');
  });

  it('printHelp does not advertise the removed <cwd>/catalog fallback as default', () => {
    printHelp();
    const message = logSpy.mock.calls.map((c) => c[0]).join('\n') as string;
    const skillsDirLine = message
      .split('\n')
      .find((l) => l.includes('EZSKILLS_SKILLS_DIR'));
    expect(skillsDirLine).toBeDefined();
    expect(skillsDirLine).not.toMatch(/<cwd>\/catalog/);
    expect(skillsDirLine).not.toMatch(/falls back/i);
  });

  it('printHelp documents the bundled catalog as the default source', () => {
    printHelp();
    const message = logSpy.mock.calls.map((c) => c[0]).join('\n') as string;
    expect(message).toMatch(/bundled catalog/i);
  });
});
