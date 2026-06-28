import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { MainMenu } from '../main-menu.js';

describe('MainMenu', () => {
  it('renders all options', () => {
    const { lastFrame } = render(
      React.createElement(MainMenu, {
        options: [
          { id: 'install', label: 'Install' },
          { id: 'uninstall', label: 'Uninstall' },
        ],
        canGoBack: false,
        onSelect: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Install');
    expect(lastFrame()).toContain('Uninstall');
  });

  it('renders the title', () => {
    const { lastFrame } = render(
      React.createElement(MainMenu, {
        options: [{ id: 'a', label: 'A' }],
        canGoBack: false,
        onSelect: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('ezskills');
  });

  it('highlights the first option by default', () => {
    const { lastFrame } = render(
      React.createElement(MainMenu, {
        options: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ],
        canGoBack: false,
        onSelect: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('>');
  });

  it('shows description for options that have it', () => {
    const { lastFrame } = render(
      React.createElement(MainMenu, {
        options: [{ id: 'a', label: 'A', description: 'desc' }],
        canGoBack: false,
        onSelect: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('desc');
  });

  it('shows "esc/q to exit"', () => {
    const { lastFrame } = render(
      React.createElement(MainMenu, {
        options: [{ id: 'a', label: 'A' }],
        canGoBack: false,
        onSelect: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('esc/q to exit');
    expect(lastFrame()).toContain('j/k move');
  });
});
