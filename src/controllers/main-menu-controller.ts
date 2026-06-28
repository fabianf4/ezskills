import { MenuState } from '../models/menu-state.js';
import type { Scope } from '../types/index.js';

export interface MainMenuOption {
  id: string;
  label: string;
  description?: string;
}

export const MAIN_MENU_OPTIONS: ReadonlyArray<MainMenuOption> = [
  {
    id: 'auto',
    label: 'Auto-detect and install',
    description: 'AutoSkills from Midudev',
  },
  { id: 'install', label: 'Install Skills' },
  { id: 'uninstall', label: 'Uninstall Skills' },
];

export interface MainMenuHandlers {
  onInstall: (scope: Scope) => void;
  onUninstall: (scope: Scope) => void;
  onAuto: () => void;
  onExit: () => void;
}

export class MainMenuController {
  constructor(
    private readonly menu: MenuState,
    private readonly handlers: MainMenuHandlers,
  ) {}

  getOptions(): ReadonlyArray<MainMenuOption> {
    return MAIN_MENU_OPTIONS;
  }

  canGoBack(): boolean {
    return false;
  }

  back(): void {
    this.menu.reset();
    this.handlers.onExit();
  }

  handleSelect(optionId: string, scope: Scope): void {
    switch (optionId) {
      case 'auto':
        this.menu.go('auto');
        this.handlers.onAuto();
        return;
      case 'install':
        this.menu.go('install');
        this.handlers.onInstall(scope);
        return;
      case 'uninstall':
        this.menu.go('uninstall');
        this.handlers.onUninstall(scope);
        return;
      default:
        throw new Error(`MainMenuController: unknown option "${optionId}"`);
    }
  }
}
