import { describe, it, expect } from 'vitest';
import { InstallState } from '../install-state.js';
import type { IndexedSkill } from '../../types/index.js';

const SAMPLE: IndexedSkill[] = [
  { name: 'react', description: 'React UI', technologies: ['React'], path: '/r' },
  { name: 'vue', description: 'Vue UI', technologies: ['Vue'], path: '/v' },
  { name: 'zod', description: 'Zod validation', technologies: ['Zod'], path: '/z' },
];

describe('InstallState', () => {
  it('starts with empty selection, empty query, and local scope', () => {
    const state = new InstallState();
    expect(state.getSelectedNames()).toEqual([]);
    expect(state.getQuery()).toBe('');
    expect(state.getScope()).toBe('local');
  });

  it('toggle adds and removes names', () => {
    const state = new InstallState();
    state.toggle('react');
    expect(state.isSelected('react')).toBe(true);
    state.toggle('react');
    expect(state.isSelected('react')).toBe(false);
  });

  it('toggle supports multiple selections', () => {
    const state = new InstallState();
    state.toggle('react');
    state.toggle('vue');
    expect(state.getSelectedNames().sort()).toEqual(['react', 'vue']);
  });

  it('clearSelection empties selection', () => {
    const state = new InstallState();
    state.toggle('react');
    state.toggle('vue');
    state.clearSelection();
    expect(state.getSelectedNames()).toEqual([]);
  });

  it('setQuery updates query', () => {
    const state = new InstallState();
    state.setQuery('react');
    expect(state.getQuery()).toBe('react');
  });

  it('setScope updates scope', () => {
    const state = new InstallState();
    state.setScope('local');
    expect(state.getScope()).toBe('local');
  });

  it('filter applies SearchService', () => {
    const state = new InstallState();
    state.setQuery('react');
    expect(state.filter(SAMPLE).map((s) => s.name)).toEqual(['react']);
  });

  it('filter with empty query returns all', () => {
    const state = new InstallState();
    expect(state.filter(SAMPLE)).toHaveLength(3);
  });

  it('isInstalled checks against installed set', () => {
    const state = new InstallState();
    const installed = new Set(['react']);
    expect(state.isInstalled('react', installed)).toBe(true);
    expect(state.isInstalled('vue', installed)).toBe(false);
  });
});
