import { describe, it, expect } from 'vitest';
import { MenuState } from '../menu-state.js';

describe('MenuState', () => {
  it('starts at main', () => {
    const state = new MenuState();
    expect(state.getCurrent()).toBe('main');
  });

  it('go() navigates to a screen', () => {
    const state = new MenuState();
    state.go('install');
    expect(state.getCurrent()).toBe('install');
  });

  it('go() then reset() returns to main', () => {
    const state = new MenuState();
    state.go('uninstall');
    state.reset();
    expect(state.getCurrent()).toBe('main');
  });
});
