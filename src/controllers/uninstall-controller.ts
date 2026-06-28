import type { InstalledSkill, Scope } from '../types/index.js';
import { InstallerService, type UninstallResult } from '../services/installer/installer-service.js';
import { InstalledSkillsRepository } from '../repositories/installed-skills-repository.js';
import { UninstallState } from '../models/uninstall-state.js';

export interface UninstallControllerHandlers {
  onBack: () => void;
  onResult: (result: UninstallResult) => void;
}

export class UninstallController {
  private readonly state: UninstallState = new UninstallState();

  constructor(
    private readonly installedRepo: InstalledSkillsRepository,
    private readonly installer: InstallerService,
    private readonly providerIds: ReadonlySet<string> | undefined,
    private readonly handlers: UninstallControllerHandlers,
  ) {}

  async loadInstalled(): Promise<InstalledSkill[]> {
    const all = await this.installedRepo.listByScope(this.state.getScope());
    if (!this.providerIds) return all;
    return all.filter((s) => this.providerIds!.has(s.providerId));
  }

  setScope(scope: Scope): void {
    this.state.setScope(scope);
  }

  getScope(): Scope {
    return this.state.getScope();
  }

  toggle(name: string): void {
    this.state.toggle(name);
  }

  isSelected(name: string): boolean {
    return this.state.isSelected(name);
  }

  beginConfirm(): void {
    this.state.beginConfirm();
  }

  cancelConfirm(): void {
    this.state.cancelConfirm();
  }

  isConfirming(): boolean {
    return this.state.isConfirming();
  }

  async confirm(): Promise<void> {
    const installed = await this.loadInstalled();
    const toUninstall = this.state.selectFrom(installed);
    if (toUninstall.length === 0) {
      this.cancelConfirm();
      return;
    }
    try {
      const result = await this.installer.uninstallMany(toUninstall);
      this.handlers.onResult(result);
    } finally {
      this.cancelConfirm();
    }
  }

  back(): void {
    this.handlers.onBack();
  }
}
