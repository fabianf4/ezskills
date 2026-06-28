import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { UninstallScreen } from '../uninstall-screen.js';
import type { InstalledSkill } from '../../../types/index.js';

const SAMPLE: InstalledSkill[] = [
  { name: 'react', scope: 'global', providerId: 'opencode', path: '/r' },
  { name: 'zod', scope: 'global', providerId: 'opencode', path: '/z' },
];

describe('UninstallScreen', () => {
  it('shows the title and installed skills', () => {
    const { lastFrame } = render(
      React.createElement(UninstallScreen, {
        installed: SAMPLE,
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
        scope: 'global',
        onScopeChange: () => {},
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Tab to switch');
    expect(lastFrame()).not.toContain('g/l to switch');
  });
});
