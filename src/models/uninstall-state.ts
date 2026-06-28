import type { InstalledSkill, Scope } from '../types/index.js';

export class UninstallState {
  private selected: Set<string> = new Set();
  private scope: Scope = 'local';
  private confirming: boolean = false;

  getScope(): Scope {
    return this.scope;
  }

  setScope(s: Scope): void {
    this.scope = s;
    this.selected.clear();
  }

  isSelected(name: string): boolean {
    return this.selected.has(name);
  }

  toggle(name: string): void {
    if (this.selected.has(name)) {
      this.selected.delete(name);
    } else {
      this.selected.add(name);
    }
  }

  clearSelection(): void {
    this.selected.clear();
  }

  getSelectedNames(): string[] {
    return [...this.selected];
  }

  isConfirming(): boolean {
    return this.confirming;
  }

  beginConfirm(): void {
    this.confirming = true;
  }

  cancelConfirm(): void {
    this.confirming = false;
  }

  selectFrom(installed: InstalledSkill[]): InstalledSkill[] {
    return installed.filter((s) => this.selected.has(s.name));
  }
}
