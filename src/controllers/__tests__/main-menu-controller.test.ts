import { describe, it, expect, vi } from 'vitest';
import { MainMenuController, MAIN_MENU_OPTIONS } from '../main-menu-controller.js';
import { MenuState } from '../../models/menu-state.js';
import type { Scope } from '../../types/index.js';

const buildHandlers = () => ({
  onInstall: vi.fn<(scope: Scope) => void>(),
  onUninstall: vi.fn<(scope: Scope) => void>(),
  onExit: vi.fn<() => void>(),
});

describe('MainMenuController', () => {
  it('getOptions() returns the top-level options', () => {
    const c = new MainMenuController(new MenuState(), buildHandlers());
    expect(c.getOptions().map((o) => o.id)).toEqual(MAIN_MENU_OPTIONS.map((o) => o.id));
  });

  it('canGoBack() is false (main is the entry point)', () => {
    const c = new MainMenuController(new MenuState(), buildHandlers());
    expect(c.canGoBack()).toBe(false);
  });

  it('handleSelect("install", "global") navigates to install and calls onInstall with global', () => {
    const menu = new MenuState();
    const h = buildHandlers();
    const c = new MainMenuController(menu, h);

    c.handleSelect('install', 'global');

    expect(menu.getCurrent()).toBe('install');
    expect(h.onInstall).toHaveBeenCalledWith('global');
  });

  it('handleSelect("install", "local") navigates to install and calls onInstall with local', () => {
    const menu = new MenuState();
    const h = buildHandlers();
    const c = new MainMenuController(menu, h);

    c.handleSelect('install', 'local');

    expect(menu.getCurrent()).toBe('install');
    expect(h.onInstall).toHaveBeenCalledWith('local');
  });

  it('handleSelect("uninstall", "global") navigates to uninstall and calls onUninstall with global', () => {
    const menu = new MenuState();
    const h = buildHandlers();
    const c = new MainMenuController(menu, h);

    c.handleSelect('uninstall', 'global');

    expect(menu.getCurrent()).toBe('uninstall');
    expect(h.onUninstall).toHaveBeenCalledWith('global');
  });

  it('handleSelect("uninstall", "local") navigates to uninstall and calls onUninstall with local', () => {
    const menu = new MenuState();
    const h = buildHandlers();
    const c = new MainMenuController(menu, h);

    c.handleSelect('uninstall', 'local');

    expect(menu.getCurrent()).toBe('uninstall');
    expect(h.onUninstall).toHaveBeenCalledWith('local');
  });

  it('handleSelect does not call the other handlers', () => {
    const menu = new MenuState();
    const h = buildHandlers();
    const c = new MainMenuController(menu, h);

    c.handleSelect('install', 'global');

    expect(h.onUninstall).not.toHaveBeenCalled();
    expect(h.onExit).not.toHaveBeenCalled();
  });

  it('back() at main calls onExit and resets the menu', () => {
    const menu = new MenuState();
    const h = buildHandlers();
    const c = new MainMenuController(menu, h);
    menu.go('install');

    c.back();

    expect(h.onExit).toHaveBeenCalledTimes(1);
    expect(menu.getCurrent()).toBe('main');
  });

  it('handleSelect with unknown option throws', () => {
    const c = new MainMenuController(new MenuState(), buildHandlers());
    expect(() => c.handleSelect('nope', 'global')).toThrow(/unknown option/i);
  });
});

describe('MAIN_MENU_OPTIONS', () => {
  it('exposes install and uninstall in order', () => {
    expect(MAIN_MENU_OPTIONS.map((o) => o.id)).toEqual(['install', 'uninstall']);
  });

  it('install option label is in English', () => {
    const install = MAIN_MENU_OPTIONS.find((o) => o.id === 'install');
    expect(install?.label).toBe('Install Skills');
  });

  it('uninstall option label is in English', () => {
    const uninstall = MAIN_MENU_OPTIONS.find((o) => o.id === 'uninstall');
    expect(uninstall?.label).toBe('Uninstall Skills');
  });
});
