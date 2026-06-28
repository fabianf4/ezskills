import { describe, it, expect } from 'vitest';
import { SearchService } from '../search-service.js';
import type { IndexedSkill } from '../../../types/index.js';

const SAMPLE: IndexedSkill[] = [
  {
    name: 'react',
    description: 'React UI library for building user interfaces',
    technologies: ['React', 'Frontend'],
    path: '/skills/react',
  },
  {
    name: 'next',
    description: 'Next.js framework with file-based routing',
    technologies: ['Next.js', 'React'],
    path: '/skills/next',
  },
  {
    name: 'vue',
    description: 'Vue progressive framework',
    technologies: ['Vue', 'Frontend'],
    path: '/skills/vue',
  },
  {
    name: 'zod',
    description: 'Zod schema validation',
    technologies: ['Zod', 'Schema'],
    path: '/skills/zod',
  },
  {
    name: 'frontend-react',
    description: 'Composite frontend rules',
    technologies: ['Frontend'],
    path: '/skills/frontend-react',
  },
];

describe('SearchService', () => {
  const service = new SearchService();

  it('matches by name (partial, case-insensitive)', () => {
    const result = service.search(SAMPLE, 'react');
    expect(result.map((s) => s.name).sort()).toEqual(['frontend-react', 'next', 'react']);
  });

  it('matches by name case-insensitively', () => {
    const result = service.search(SAMPLE, 'REACT');
    expect(result.map((s) => s.name).sort()).toEqual(['frontend-react', 'next', 'react']);
  });

  it('matches by technology', () => {
    const result = service.search(SAMPLE, 'zod');
    expect(result.map((s) => s.name)).toEqual(['zod']);
  });

  it('matches by partial description', () => {
    const result = service.search(SAMPLE, 'routing');
    expect(result.map((s) => s.name)).toEqual(['next']);
  });

  it('matches by partial technology name', () => {
    const result = service.search(SAMPLE, 'front');
    expect(result.map((s) => s.name).sort()).toEqual(['frontend-react', 'react', 'vue']);
  });

  it('returns all skills when query is empty', () => {
    expect(service.search(SAMPLE, '')).toHaveLength(SAMPLE.length);
  });

  it('returns all skills when query is only whitespace', () => {
    expect(service.search(SAMPLE, '   ')).toHaveLength(SAMPLE.length);
  });

  it('returns empty array when no match', () => {
    expect(service.search(SAMPLE, 'cobol')).toEqual([]);
  });

  it('AND multiple terms: each token must match some field', () => {
    const result = service.search(SAMPLE, 'react frontend');
    expect(result.map((s) => s.name).sort()).toEqual(['frontend-react', 'react']);
  });

  it('AND multiple terms excludes items missing any token', () => {
    const result = service.search(SAMPLE, 'react cobol');
    expect(result).toEqual([]);
  });

  it('does not crash on skills with empty technologies', () => {
    const skills: IndexedSkill[] = [
      { name: 'plain', description: 'no techs', technologies: [], path: '/p' },
    ];
    expect(service.search(skills, 'plain')).toHaveLength(1);
    expect(service.search(skills, 'missing')).toEqual([]);
  });

  it('trims leading/trailing whitespace from query', () => {
    expect(service.search(SAMPLE, '  react  ').map((s) => s.name)).toContain('react');
  });

  it('handles empty skills array', () => {
    expect(service.search([], 'react')).toEqual([]);
  });

  it('ignores extra whitespace between tokens', () => {
    const result = service.search(SAMPLE, 'react    frontend');
    expect(result.map((s) => s.name).sort()).toEqual(['frontend-react', 'react']);
  });
});
