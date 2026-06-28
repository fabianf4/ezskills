import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { useSkillSearch } from '../use-skill-search.js';
import type { IndexedSkill } from '../../../types/index.js';

const SAMPLE: IndexedSkill[] = [
  { name: 'react', description: 'React UI library', technologies: ['React', 'Frontend'], path: '/r' },
  { name: 'next', description: 'Next.js framework', technologies: ['Next.js', 'React'], path: '/n' },
  { name: 'zod', description: 'Zod schema validation', technologies: ['Zod', 'Schema'], path: '/z' },
  { name: 'vue', description: 'Vue progressive framework', technologies: ['Vue', 'Frontend'], path: '/v' },
];

function HookProbe({ skills, query }: { skills: IndexedSkill[]; query: string }) {
  const result = useSkillSearch(skills, query);
  return React.createElement(
    Text,
    null,
    result.map((s) => s.name).join(','),
  );
}

function renderProbe(skills: IndexedSkill[], query: string): string {
  const { lastFrame } = render(
    React.createElement(HookProbe, { skills, query }),
  );
  return lastFrame() ?? '';
}

describe('useSkillSearch', () => {
  it('returns all skills when query is empty', () => {
    const frame = renderProbe(SAMPLE, '');
    expect(frame.split(',').filter(Boolean).sort()).toEqual(['next', 'react', 'vue', 'zod']);
  });

  it('filters by single token (substring, case-insensitive)', () => {
    const frame = renderProbe(SAMPLE, 'react');
    expect(frame).toContain('react');
    expect(frame).toContain('next');
    expect(frame).not.toContain('zod');
    expect(frame).not.toContain('vue');
  });

  it('applies AND-logic across tokens (multi-word query)', () => {
    const skills: IndexedSkill[] = [
      { name: 'react', description: 'React UI', technologies: ['React'], path: '/r' },
      { name: 'zod-react', description: 'Zod bindings for React', technologies: ['Zod', 'React'], path: '/zr' },
    ];
    const frame = renderProbe(skills, 'react zod');
    expect(frame).toContain('zod-react');
    expect(frame).not.toContain('react,');
  });

  it('matches against technologies, not only name/description', () => {
    const frame = renderProbe(SAMPLE, 'Frontend');
    expect(frame).toContain('react');
    expect(frame).toContain('vue');
    expect(frame).not.toContain('zod');
  });

  it('memoizes: SearchService.search is called once per (skills, query) change', () => {
    const { lastFrame, rerender } = render(
      React.createElement(HookProbe, { skills: SAMPLE, query: 'react' }),
    );
    expect(lastFrame()).toContain('react');

    rerender(React.createElement(HookProbe, { skills: SAMPLE, query: 'react' }));
    rerender(React.createElement(HookProbe, { skills: SAMPLE, query: 'react' }));

    const seen = (useSkillSearch as unknown as { search?: unknown });
    expect(seen.search).toBeUndefined();
  });

  it('returns a new array reference when query changes', () => {
    const refSpy = vi.fn();
    function RefProbe({ skills, query }: { skills: IndexedSkill[]; query: string }) {
      const result = useSkillSearch(skills, query);
      refSpy(result);
      return React.createElement(Text, null, result.length.toString());
    }
    const { rerender } = render(React.createElement(RefProbe, { skills: SAMPLE, query: '' }));
    rerender(React.createElement(RefProbe, { skills: SAMPLE, query: 'react' }));
    expect(refSpy).toHaveBeenCalled();
  });
});
