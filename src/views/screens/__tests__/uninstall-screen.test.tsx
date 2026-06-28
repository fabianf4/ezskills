import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { UninstallScreen } from '../uninstall-screen.js';
import type { IndexedSkill, InstalledSkill } from '../../../types/index.js';

const SAMPLE: InstalledSkill[] = [
  { name: 'react', scope: 'global', providerId: 'opencode', path: '/r' },
  { name: 'zod', scope: 'global', providerId: 'opencode', path: '/z' },
];

const AVAILABLE: IndexedSkill[] = [
  { name: 'react', description: 'React UI library', technologies: ['React'], path: '/src/react' },
  { name: 'zod', description: 'Zod schema validation', technologies: ['Zod'], path: '/src/zod' },
];

describe('UninstallScreen', () => {
  it('shows the title and installed skills', () => {
    const { lastFrame } = render(
      React.createElement(UninstallScreen, {
        installed: SAMPLE,
        available: AVAILABLE,
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Uninstall Skills');
    expect(lastFrame()).toContain('react');
    expect(lastFrame()).toContain('zod');
  });

  it('shows "No skills installed" when empty', () => {
    const { lastFrame } = render(
      React.createElement(UninstallScreen, {
        installed: [],
        available: [],
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('No skills installed');
  });

  it('shows "Global (not recommended)" when scope is global', () => {
    const { lastFrame } = render(
      React.createElement(UninstallScreen, {
        installed: SAMPLE,
        available: AVAILABLE,
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
      React.createElement(UninstallScreen, {
        installed: SAMPLE,
        available: AVAILABLE,
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
      React.createElement(UninstallScreen, {
        installed: SAMPLE,
        available: AVAILABLE,
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Tab to switch');
    expect(lastFrame()).not.toContain('g/l to switch');
  });

  it('uses description from available as subtitle, not providerId', () => {
    const { lastFrame } = render(
      React.createElement(UninstallScreen, {
        installed: SAMPLE,
        available: AVAILABLE,
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('React UI library');
    expect(frame).not.toContain('    opencode');
    expect(frame).not.toContain('    openclaw');
  });

  it('renders no subtitle when the installed skill is not in the catalog', () => {
    const installed: InstalledSkill[] = [
      { name: 'orphan', scope: 'global', providerId: 'opencode', path: '/orphan' },
    ];
    const { lastFrame } = render(
      React.createElement(UninstallScreen, {
        installed,
        available: AVAILABLE,
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('orphan');
    expect(frame).not.toContain('    opencode');
  });

  it('shows the catalog description for skills installed by multiple providers', () => {
    const installed: InstalledSkill[] = [
      { name: 'zod', scope: 'global', providerId: 'opencode', path: '/a' },
      { name: 'zod', scope: 'local', providerId: 'openclaw', path: '/b' },
    ];
    const { lastFrame } = render(
      React.createElement(UninstallScreen, {
        installed,
        available: AVAILABLE,
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Zod schema validation');
    expect(frame).not.toContain('opencode');
    expect(frame).not.toContain('openclaw');
  });
});
