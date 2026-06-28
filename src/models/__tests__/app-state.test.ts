import { describe, it, expect } from 'vitest';
import { AppState } from '../app-state.js';

describe('AppState', () => {
  it('exposes a menu state', () => {
    const state = new AppState();
    expect(state.menu.getCurrent()).toBe('main');
  });
});
