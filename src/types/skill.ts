import type { Scope } from './scope.js';

export interface IndexedSkill {
  name: string;
  description: string;
  technologies: string[];
  path: string;
}

export interface InstalledSkill {
  name: string;
  scope: Scope;
  providerId: string;
  path: string;
}
