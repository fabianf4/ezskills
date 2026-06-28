import type {
  IndexedSkill,
  InstalledSkill,
  Scope,
  SkillProvider,
} from '../../types/index.js';
import { InstalledSkillsRepository } from '../../repositories/installed-skills-repository.js';

export interface OperationFailure {
  name: string;
  error: string;
}

export interface InstallResult {
  installed: string[];
  skipped: string[];
  failed: OperationFailure[];
}

export interface UninstallResult {
  uninstalled: string[];
  failed: OperationFailure[];
}

export class InstallerService {
  constructor(
    private readonly providers: Map<string, SkillProvider>,
    private readonly installedRepo: InstalledSkillsRepository,
  ) {}

  async installMany(
    skills: IndexedSkill[],
    scope: Scope,
    providerId: string,
  ): Promise<InstallResult> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`InstallerService: unknown provider "${providerId}"`);
    }

    const installed = await this.installedRepo.listByScopeAndProvider(scope, providerId);
    const installedNames = new Set(installed.map((s) => s.name));

    const result: InstallResult = { installed: [], skipped: [], failed: [] };

    for (const skill of skills) {
      if (installedNames.has(skill.name)) {
        result.skipped.push(skill.name);
        continue;
      }
      try {
        await provider.install(skill, scope);
        result.installed.push(skill.name);
      } catch (err) {
        result.failed.push({ name: skill.name, error: (err as Error).message });
      }
    }

    return result;
  }

  async uninstallMany(skills: InstalledSkill[]): Promise<UninstallResult> {
    const result: UninstallResult = { uninstalled: [], failed: [] };

    for (const skill of skills) {
      const provider = this.providers.get(skill.providerId);
      if (!provider) {
        result.failed.push({
          name: skill.name,
          error: `unknown provider "${skill.providerId}"`,
        });
        continue;
      }
      try {
        await provider.uninstall(skill);
        result.uninstalled.push(skill.name);
      } catch (err) {
        result.failed.push({ name: skill.name, error: (err as Error).message });
      }
    }

    return result;
  }
}
