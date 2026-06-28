import { join, dirname } from 'node:path';
import type { Dirent } from 'node:fs';
import type { IndexedSkill, FsAdapter } from '../../types/index.js';
import { parseFrontmatter } from './frontmatter-parser.js';

export interface SkillIndexerOptions {
  skillsDir: string;
  indexPath: string;
  fs: FsAdapter;
}

export class SkillIndexer {
  private readonly skillsDir: string;
  private readonly indexPath: string;
  private readonly fs: FsAdapter;

  constructor(options: SkillIndexerOptions) {
    this.skillsDir = options.skillsDir;
    this.indexPath = options.indexPath;
    this.fs = options.fs;
  }

  async run(): Promise<IndexedSkill[]> {
    const entries = await this.safeReaddir(this.skillsDir);
    const skills: IndexedSkill[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const folderPath = join(this.skillsDir, entry.name);
      const skill = await this.tryBuildSkill(entry.name, folderPath);
      if (skill !== null) {
        skills.push(skill);
      }
    }

    skills.sort((a, b) => a.name.localeCompare(b.name));

    await this.persist(skills);
    return skills;
  }

  private async safeReaddir(path: string): Promise<Dirent[]> {
    try {
      return await this.fs.readdir(path, { withFileTypes: true });
    } catch {
      return [];
    }
  }

  private async tryBuildSkill(_folderName: string, folderPath: string): Promise<IndexedSkill | null> {
    const skillMdPath = join(folderPath, 'SKILL.md');
    let content: string;
    try {
      content = await this.fs.readFile(skillMdPath, 'utf-8');
    } catch {
      return null;
    }

    const fm = parseFrontmatter(content);
    if (fm === null) {
      return null;
    }

    const technologies = await this.readTechnologies(folderPath);
    return {
      name: fm.name,
      description: fm.description,
      technologies,
      path: folderPath,
    };
  }

  private async readTechnologies(folderPath: string): Promise<string[]> {
    const metadataPath = join(folderPath, 'metadata.json');
    let raw: string;
    try {
      raw = await this.fs.readFile(metadataPath, 'utf-8');
    } catch {
      return [];
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return [];
    }

    const data = parsed as Record<string, unknown>;
    const techs: string[] = [];

    if (typeof data['technology'] === 'string' && data['technology'].length > 0) {
      techs.push(data['technology']);
    }
    if (typeof data['category'] === 'string' && data['category'].length > 0) {
      techs.push(data['category']);
    }

    return techs;
  }

  private async persist(skills: IndexedSkill[]): Promise<void> {
    const parent = dirname(this.indexPath);
    if (parent && parent !== '.') {
      await this.fs.mkdir(parent, { recursive: true });
    }
    await this.fs.writeFile(this.indexPath, JSON.stringify(skills, null, 2));
  }
}
