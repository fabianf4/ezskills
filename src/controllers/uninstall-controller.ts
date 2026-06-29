import type { InstalledSkill, Scope } from '../types/index.js';
import { InstallerService, type UninstallResult } from '../services/installer/installer-service.js';
import { InstalledSkillsRepository } from '../repositories/installed-skills-repository.js';

export interface UninstallControllerHandlers {
  onBack: () => void;
  onResult: (result: UninstallResult) => void;
}

export class UninstallController {
  constructor(
    private readonly installedRepo: InstalledSkillsRepository,
    private readonly installer: InstallerService,
    private readonly providerIds: ReadonlySet<string> | undefined,
    private readonly handlers: UninstallControllerHandlers,
  ) {}

  async loadInstalled(scope: Scope): Promise<InstalledSkill[]> {
    const all = await this.installedRepo.listByScope(scope);
    if (!this.providerIds) return all;
    return all.filter((s) => this.providerIds!.has(s.providerId));
  }

  async confirm(skills: InstalledSkill[]): Promise<void> {
    if (skills.length === 0) {
      return;
    }
    const result = await this.installer.uninstallMany(skills);
    this.handlers.onResult(result);
  }

  back(): void {
    this.handlers.onBack();
  }
}
