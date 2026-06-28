import type { Detector, DetectionResult } from '../../types/index.js';

export class StubDetector implements Detector {
  detect(_projectPath: string): Promise<DetectionResult> {
    return Promise.resolve({
      technologies: [],
      suggestedSkillNames: [],
    });
  }
}
