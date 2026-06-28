import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { InstallScreen } from '../install-screen.js';
import type { IndexedSkill } from '../../../types/index.js';

const SAMPLE: IndexedSkill[] = [
  { name: 'react', description: 'React UI', technologies: ['React'], path: '/r' },
  { name: 'zod', description: 'Zod validation', technologies: ['Zod'], path: '/z' },
];

describe('InstallScreen', () => {
  it('shows the title and all available skills', () => {
    const { lastFrame } = render(
      React.createElement(InstallScreen, {
        available: SAMPLE,
        installedNames: new Set<string>(),
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Install Skills');
    expect(lastFrame()).toContain('react');
    expect(lastFrame()).toContain('zod');
  });

  it('shows "No skills found" when available is empty', () => {
    const { lastFrame } = render(
      React.createElement(InstallScreen, {
        available: [],
        installedNames: new Set<string>(),
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('No skills found');
  });

  it('shows the search input with placeholder', () => {
    const { lastFrame } = render(
      React.createElement(InstallScreen, {
        available: SAMPLE,
        installedNames: new Set<string>(),
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Search');
  });

  it('shows "Global (not recommended)" when scope is global', () => {
    const { lastFrame } = render(
      React.createElement(InstallScreen, {
        available: SAMPLE,
        installedNames: new Set<string>(),
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Global (not recommended)');
  });

  it('shows "Local" without the warning when scope is local', () => {
    const { lastFrame } = render(
      React.createElement(InstallScreen, {
        available: SAMPLE,
        installedNames: new Set<string>(),
        scope: 'local',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Local');
    expect(lastFrame()).not.toContain('not recommended');
  });

  it('shows the s switch hint in the header', () => {
    const { lastFrame } = render(
      React.createElement(InstallScreen, {
        available: SAMPLE,
        installedNames: new Set<string>(),
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Tab to switch');
    expect(lastFrame()).not.toContain('g/l to switch');
  });

  it('shows "✓ installed" next to skills that are in installedNames', () => {
    const { lastFrame } = render(
      React.createElement(InstallScreen, {
        available: SAMPLE,
        installedNames: new Set(['zod']),
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    const frame = lastFrame()!;
    expect(frame).toContain('✓ installed');
    const lines = frame.split('\n');
    const zodLine = lines.find((l) => l.includes('zod')) ?? '';
    const reactLine = lines.find((l) => l.includes('react')) ?? '';
    expect(zodLine).toContain('✓ installed');
    expect(reactLine).not.toContain('✓ installed');
  });
});
