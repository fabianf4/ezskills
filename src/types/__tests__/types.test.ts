import { describe, it, expectTypeOf } from 'vitest';
import type {
  Scope,
  IndexedSkill,
  InstalledSkill,
  SkillProvider,
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

  it('exposes readonly label', () => {
    expectTypeOf<SkillProvider>().toHaveProperty('label');
    expectTypeOf<SkillProvider['label']>().toEqualTypeOf<string>();
  });

  it('exposes readonly isInstalled (boolean)', () => {
    expectTypeOf<SkillProvider>().toHaveProperty('isInstalled');
    expectTypeOf<SkillProvider['isInstalled']>().toEqualTypeOf<boolean>();
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
