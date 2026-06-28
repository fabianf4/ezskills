import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { AutoDetectResult } from '../auto-detect-screen.js';
import type { IndexedSkill } from '../../../types/index.js';

describe('AutoDetectResult', () => {
  it('shows loading state', () => {
    const { lastFrame } = render(
      React.createElement(AutoDetectResult, {
        loading: true,
        technologies: [],
        suggested: [],
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Detecting');
  });

  it('shows empty state when no techs detected', () => {
    const { lastFrame } = render(
      React.createElement(AutoDetectResult, {
        loading: false,
        technologies: [],
        suggested: [],
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('No technologies');
  });

  it('shows detected technologies and suggested skills', () => {
    const skills: IndexedSkill[] = [
      { name: 'react', description: 'React UI', technologies: ['React'], path: '/r' },
    ];
    const { lastFrame } = render(
      React.createElement(AutoDetectResult, {
        loading: false,
        technologies: ['React'],
        suggested: skills,
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('React');
    expect(lastFrame()).toContain('react');
  });
});
