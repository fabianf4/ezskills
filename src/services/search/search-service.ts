import type { IndexedSkill } from '../../types/index.js';

export class SearchService {
  search(skills: IndexedSkill[], query: string): IndexedSkill[] {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tokens.length === 0) {
      return [...skills];
    }

    return skills.filter((skill) =>
      tokens.every((token) => this.skillMatchesToken(skill, token)),
    );
  }

  private skillMatchesToken(skill: IndexedSkill, token: string): boolean {
    if (skill.name.toLowerCase().includes(token)) {
      return true;
    }
    if (skill.description.toLowerCase().includes(token)) {
      return true;
    }
    return skill.technologies.some((tech) => tech.toLowerCase().includes(token));
  }
}
