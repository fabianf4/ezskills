export type MenuScreen = 'main' | 'install' | 'uninstall' | 'auto';

export class MenuState {
  private current: MenuScreen = 'main';

  getCurrent(): MenuScreen {
    return this.current;
  }

  go(screen: MenuScreen): void {
    this.current = screen;
  }

  reset(): void {
    this.current = 'main';
  }
}
