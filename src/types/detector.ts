export interface DetectionResult {
  technologies: string[];
  suggestedSkillNames: string[];
}

export interface Detector {
  detect(projectPath: string): Promise<DetectionResult>;
}
