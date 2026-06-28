import { describe, it, expect } from 'vitest';
import { UninstallState } from '../uninstall-state.js';
import type { InstalledSkill } from '../../types/index.js';

const INSTALLED: InstalledSkill[] = [
  { name: 'a', scope: 'global', providerId: 'opencode', path: '/a' },
  { name: 'b', scope: 'global', providerId: 'opencode', path: '/b' },
  { name: 'c', scope: 'global', providerId: 'opencode', path: '/c' },
];

describe('UninstallState', () => {
  it('starts with empty selection and local scope', () => {
    const state = new UninstallState();
    expect(state.getSelectedNames()).toEqual([]);
    expect(state.getScope()).toBe('local');
    expect(state.isConfirming()).toBe(false);
  });

  it('toggle adds and removes names', () => {
    const state = new UninstallState();
    state.toggle('a');
    expect(state.isSelected('a')).toBe(true);
    state.toggle('a');
    expect(state.isSelected('a')).toBe(false);
  });

  it('clearSelection empties selection', () => {
    const state = new UninstallState();
    state.toggle('a');
    state.clearSelection();
    expect(state.getSelectedNames()).toEqual([]);
  });

  it('setScope updates scope and clears selection', () => {
    const state = new UninstallState();
    state.toggle('a');
    state.setScope('local');
    expect(state.getScope()).toBe('local');
    expect(state.getSelectedNames()).toEqual([]);
  });

  it('beginConfirm and cancelConfirm toggle confirming', () => {
    const state = new UninstallState();
    state.beginConfirm();
    expect(state.isConfirming()).toBe(true);
    state.cancelConfirm();
    expect(state.isConfirming()).toBe(false);
  });

  it('selectFrom filters installed by selection', () => {
    const state = new UninstallState();
    state.toggle('a');
    state.toggle('c');
    const selected = state.selectFrom(INSTALLED);
    expect(selected.map((s) => s.name).sort()).toEqual(['a', 'c']);
  });
});
