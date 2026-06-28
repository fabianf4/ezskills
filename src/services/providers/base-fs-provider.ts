import { join } from 'node:path';
import type {
  FsAdapter,
  IndexedSkill,
  InstalledSkill,
  Scope,
  SkillProvider,
} from '../../types/index.js';

export interface ProviderPaths {
  global: string;
  local: string;
}

export abstract class BaseFsProvider implements SkillProvider {
  abstract readonly id: string;

  protected constructor(
    protected readonly paths: ProviderPaths,
    protected readonly fs: FsAdapter,
  ) {}

  async install(skill: IndexedSkill, scope: Scope): Promise<void> {
    const destination = this.destinationFor(skill.name, scope);
    await this.fs.mkdir(join(destination, '..'), { recursive: true });
    if (await this.pathExists(destination)) {
      throw new Error(
        `${this.constructorName()}: cannot install "${skill.name}" (${scope}) at ${destination}: already exists`,
      );
    }
    await this.fs.cp(skill.path, destination, { recursive: true });
  }

  async uninstall(skill: InstalledSkill): Promise<void> {
    if (!(await this.pathExists(skill.path))) {
      throw new Error(
        `${this.constructorName()}: cannot uninstall "${skill.name}": path ${skill.path} does not exist`,
      );
    }
    await this.fs.rm(skill.path, { recursive: true, force: false });
  }

  async getInstalledSkills(scope: Scope): Promise<InstalledSkill[]> {
    const root = this.paths[scope];
    let entries;
    try {
      entries = await this.fs.readdir(root, { withFileTypes: true });
    } catch {
      return [];
    }
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        scope,
        providerId: this.id,
        path: join(root, entry.name),
      }));
  }

  protected destinationFor(name: string, scope: Scope): string {
    return join(this.paths[scope], name);
  }

  private constructorName(): string {
    return this.constructor.name;
  }

  private async pathExists(p: string): Promise<boolean> {
    try {
      await this.fs.stat(p);
      return true;
    } catch {
      return false;
    }
  }
}
