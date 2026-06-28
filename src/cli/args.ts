export type ParsedArgs =
  | { kind: 'run' }
  | { kind: 'version' }
  | { kind: 'help' }
  | { kind: 'error'; text: string };

const VERSION_FLAGS = new Set(['--version', '-v']);
const HELP_FLAGS = new Set(['--help', '-h']);

export function parseArgs(argv: readonly string[]): ParsedArgs {
  for (const arg of argv) {
    if (VERSION_FLAGS.has(arg)) return { kind: 'version' };
    if (HELP_FLAGS.has(arg)) return { kind: 'help' };
    if (arg.startsWith('-')) {
      return { kind: 'error', text: `Unknown option: ${arg}` };
    }
  }
  return { kind: 'run' };
}
