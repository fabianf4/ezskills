import type { IndexedSkill } from '../types/index.js';
import { Detector } from '../types/index.js';
import { SkillRepository } from '../repositories/skill-repository.js';

export interface AutoDetectControllerDeps {
  detector: Detector;
  skillRepo: SkillRepository;
  cwd: string;
}

export interface AutoDetectResult {
  technologies: string[];
  suggested: IndexedSkill[];
}

export class AutoDetectController {
  constructor(private readonly deps: AutoDetectControllerDeps) {}

  async run(): Promise<AutoDetectResult> {
    const detection = await this.deps.detector.detect(this.deps.cwd);
    const all = await this.deps.skillRepo.getAll();
    const techSet = new Set(detection.technologies.map((t) => t.toLowerCase()));

    const suggested = all.filter((skill) =>
      skill.technologies.some((t) => techSet.has(t.toLowerCase())),
    );

    return {
      technologies: detection.technologies,
      suggested: suggested.length > 0 ? suggested : detection.suggestedSkillNames
        .map((name) => all.find((s) => s.name === name))
        .filter((s): s is IndexedSkill => s !== undefined),
    };
  }
}
