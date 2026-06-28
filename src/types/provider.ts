import type { IndexedSkill, InstalledSkill } from './skill.js';
import type { Scope } from './scope.js';

export interface SkillProvider {
  readonly id: string;
  readonly label: string;
  readonly isInstalled: boolean;
  getInstalledSkills(scope: Scope): Promise<InstalledSkill[]>;
  install(skill: IndexedSkill, scope: Scope): Promise<void>;
  uninstall(skill: InstalledSkill): Promise<void>;
}

export interface ProviderListItem {
  id: string;
  label: string;
}
