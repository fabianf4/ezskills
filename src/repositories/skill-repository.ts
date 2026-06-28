import type { IndexedSkill, FsAdapter } from '../types/index.js';

function isIndexedSkill(value: unknown): value is IndexedSkill {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v['name'] === 'string' &&
    typeof v['description'] === 'string' &&
    Array.isArray(v['technologies']) &&
    v['technologies'].every((t) => typeof t === 'string') &&
    typeof v['path'] === 'string'
  );
}

export class SkillRepository {
  private cache: IndexedSkill[] | null = null;

  constructor(
    private readonly indexPath: string,
    private readonly fs: FsAdapter,
  ) {}

  async load(): Promise<IndexedSkill[]> {
    if (this.cache !== null) {
      return this.cache.map((s) => ({ ...s, technologies: [...s.technologies] }));
    }

    const raw = await this.readIndexFile();
    const parsed = this.parseIndex(raw);
    this.assertIndexIsArray(parsed);

    this.cache = parsed.filter(isIndexedSkill);
    return this.cache.map((s) => ({ ...s, technologies: [...s.technologies] }));
  }

  private async readIndexFile(): Promise<string> {
    try {
      return await this.fs.readFile(this.indexPath, 'utf-8');
    } catch (err) {
      throw new Error(
        `SkillRepository: cannot read index at ${this.indexPath}: ${(err as Error).message}`,
      );
    }
  }

  private parseIndex(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `SkillRepository: invalid JSON in index at ${this.indexPath}: ${(err as Error).message}`,
      );
    }
  }

  private assertIndexIsArray(parsed: unknown): asserts parsed is unknown[] {
    if (!Array.isArray(parsed)) {
      throw new Error(
        `SkillRepository: index at ${this.indexPath} must be an array`,
      );
    }
  }

  async getAll(): Promise<IndexedSkill[]> {
    return this.load();
  }

  async getByName(name: string): Promise<IndexedSkill | null> {
    const all = await this.load();
    return all.find((s) => s.name === name) ?? null;
  }

  async getByTechnology(tech: string): Promise<IndexedSkill[]> {
    const all = await this.load();
    return all
      .filter((s) => s.technologies.includes(tech))
      .map((s) => ({ ...s, technologies: [...s.technologies] }));
  }

  invalidate(): void {
    this.cache = null;
  }
}
