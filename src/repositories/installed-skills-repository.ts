import type { InstalledSkill, Scope, SkillProvider } from '../types/index.js';

export class InstalledSkillsRepository {
  constructor(private readonly providers: SkillProvider[]) {}

  async listAll(): Promise<InstalledSkill[]> {
    const results = await Promise.all(
      this.providers.flatMap((p) =>
        (['global', 'local'] as Scope[]).map((scope) => p.getInstalledSkills(scope)),
      ),
    );
    return results.flat();
  }

  async listByScope(scope: Scope): Promise<InstalledSkill[]> {
    const results = await Promise.all(
      this.providers.map((p) => p.getInstalledSkills(scope)),
    );
    return results.flat();
  }

  async listByProvider(providerId: string): Promise<InstalledSkill[]> {
    const provider = this.providers.find((p) => p.id === providerId);
    if (!provider) {
      return [];
    }
    const results = await Promise.all(
      (['global', 'local'] as Scope[]).map((scope) => provider.getInstalledSkills(scope)),
    );
    return results.flat();
  }

  async listByScopeAndProvider(
    scope: Scope,
    providerId: string,
  ): Promise<InstalledSkill[]> {
    const provider = this.providers.find((p) => p.id === providerId);
    if (!provider) {
      return [];
    }
    return provider.getInstalledSkills(scope);
  }
}
