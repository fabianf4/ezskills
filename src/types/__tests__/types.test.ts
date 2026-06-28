import { describe, it, expectTypeOf } from 'vitest';
import type {
  Scope,
  IndexedSkill,
  InstalledSkill,
  SkillProvider,
  Detector,
  DetectionResult,
} from '../index.js';

describe('Scope', () => {
  it('accepts "global"', () => {
    const scope: Scope = 'global';
    expectTypeOf(scope).toEqualTypeOf<'global'>();
  });

  it('accepts "local"', () => {
    const scope: Scope = 'local';
    expectTypeOf(scope).toEqualTypeOf<'local'>();
  });
});

describe('IndexedSkill', () => {
  it('has the expected shape', () => {
    expectTypeOf<IndexedSkill>().toMatchObjectType<{
      name: string;
      description: string;
      technologies: string[];
      path: string;
    }>();
  });

  it('is fully required (no optional fields)', () => {
    expectTypeOf<IndexedSkill>().toHaveProperty('name');
    expectTypeOf<IndexedSkill>().toHaveProperty('description');
    expectTypeOf<IndexedSkill>().toHaveProperty('technologies');
    expectTypeOf<IndexedSkill>().toHaveProperty('path');
  });
});

describe('InstalledSkill', () => {
  it('has the expected shape', () => {
    expectTypeOf<InstalledSkill>().toMatchObjectType<{
      name: string;
      scope: Scope;
      providerId: string;
      path: string;
    }>();
  });
});

describe('SkillProvider', () => {
  it('exposes readonly id', () => {
    expectTypeOf<SkillProvider>().toHaveProperty('id');
    expectTypeOf<SkillProvider['id']>().toEqualTypeOf<string>();
  });

  it('exposes getInstalledSkills returning Promise<InstalledSkill[]>', () => {
    expectTypeOf<SkillProvider['getInstalledSkills']>().toBeFunction();
    expectTypeOf<SkillProvider['getInstalledSkills']>().parameters.toEqualTypeOf<[Scope]>();
    expectTypeOf<SkillProvider['getInstalledSkills']>().returns.toEqualTypeOf<Promise<InstalledSkill[]>>();
  });

  it('exposes install returning Promise<void>', () => {
    expectTypeOf<SkillProvider['install']>().toBeFunction();
    expectTypeOf<SkillProvider['install']>().parameters.toEqualTypeOf<[IndexedSkill, Scope]>();
    expectTypeOf<SkillProvider['install']>().returns.toEqualTypeOf<Promise<void>>();
  });

  it('exposes uninstall returning Promise<void>', () => {
    expectTypeOf<SkillProvider['uninstall']>().toBeFunction();
    expectTypeOf<SkillProvider['uninstall']>().parameters.toEqualTypeOf<[InstalledSkill]>();
    expectTypeOf<SkillProvider['uninstall']>().returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('Detector', () => {
  it('exposes detect returning Promise<DetectionResult>', () => {
    expectTypeOf<Detector['detect']>().toBeFunction();
    expectTypeOf<Detector['detect']>().parameters.toEqualTypeOf<[string]>();
    expectTypeOf<Detector['detect']>().returns.toEqualTypeOf<Promise<DetectionResult>>();
  });
});

describe('DetectionResult', () => {
  it('has technologies and suggestedSkillNames', () => {
    expectTypeOf<DetectionResult>().toMatchObjectType<{
      technologies: string[];
      suggestedSkillNames: string[];
    }>();
  });
});
