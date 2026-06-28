export type Scope = 'global' | 'local';

export const SCOPES: readonly Scope[] = ['global', 'local'] as const;

export function isScope(value: unknown): value is Scope {
  return value === 'global' || value === 'local';
}
