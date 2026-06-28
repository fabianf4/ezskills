import type { IndexedSkill, Scope } from '../types/index.js';
import { InstallerService, type InstallResult } from '../services/installer/installer-service.js';
import { SkillRepository } from '../repositories/skill-repository.js';
import { InstalledSkillsRepository } from '../repositories/installed-skills-repository.js';
import { InstallState } from '../models/install-state.js';

export interface InstallControllerHandlers {
  onBack: () => void;
  onResult: (result: InstallResult) => void;
  onError: (message: string) => void;
}

export class InstallController {
  private readonly state: InstallState = new InstallState();

  constructor(
    private readonly skillRepo: SkillRepository,
    private readonly installedRepo: InstalledSkillsRepository,
    private readonly installer: InstallerService,
    private readonly providerIds: ReadonlySet<string>,
    private readonly handlers: InstallControllerHandlers,
  ) {}

  async loadAvailable(): Promise<IndexedSkill[]> {
    return this.skillRepo.getAll();
  }

  async loadInstalledNames(): Promise<Set<string>> {
    const names = new Set<string>();
    for (const id of this.providerIds) {
      const installed = await this.installedRepo.listByProvider(id);
      for (const s of installed) names.add(s.name);
    }
    return names;
  }

  setScope(scope: Scope): void {
    this.state.setScope(scope);
  }

  getScope(): Scope {
    return this.state.getScope();
  }

  setQuery(q: string): void {
    this.state.setQuery(q);
  }

  toggle(name: string): void {
    this.state.toggle(name);
  }

  isSelected(name: string): boolean {
    return this.state.isSelected(name);
  }

  filter(available: IndexedSkill[]): IndexedSkill[] {
    return this.state.filter(available);
  }

  async confirm(skills: IndexedSkill[]): Promise<void> {
    if (skills.length === 0) {
      this.handlers.onError('No skills selected');
      return;
    }
    if (this.providerIds.size === 0) {
      this.handlers.onError('No provider selected');
      return;
    }
    try {
      const aggregated = { installed: [], skipped: [], failed: [] } as InstallResult;
      for (const id of this.providerIds) {
        const result = await this.installer.installMany(skills, this.state.getScope(), id);
        aggregated.installed.push(...result.installed);
        aggregated.skipped.push(...result.skipped);
        aggregated.failed.push(...result.failed);
      }
      this.handlers.onResult(aggregated);
    } catch (err) {
      this.handlers.onError((err as Error).message);
    }
  }

  back(): void {
    this.handlers.onBack();
  }
}
