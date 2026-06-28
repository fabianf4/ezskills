import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { ProviderPicker } from '../provider-picker.js';

const PROVIDERS = [
  { id: 'opencode', label: 'OpenCode' },
  { id: 'openclaw', label: 'OpenClaw' },
];

describe('ProviderPicker', () => {
  it('renders all providers as items', () => {
    const { lastFrame } = render(
      React.createElement(ProviderPicker, {
        title: 'Choose tools',
        providers: PROVIDERS,
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('OpenCode');
    expect(lastFrame()).toContain('OpenClaw');
  });

  it('renders the title', () => {
    const { lastFrame } = render(
      React.createElement(ProviderPicker, {
        title: 'Choose tools to install to',
        providers: PROVIDERS,
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('Choose tools to install to');
  });

  it('starts with no provider selected', () => {
    const { lastFrame } = render(
      React.createElement(ProviderPicker, {
        title: 'Choose tools',
        providers: PROVIDERS,
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    const checked = lastFrame()?.match(/\[x\]/g) ?? [];
    const unchecked = lastFrame()?.match(/\[ \]/g) ?? [];
    expect(checked).toHaveLength(0);
    expect(unchecked).toHaveLength(2);
  });

  it('highlights the first provider by default', () => {
    const { lastFrame } = render(
      React.createElement(ProviderPicker, {
        title: 'Choose tools',
        providers: PROVIDERS,
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('> [ ] OpenCode');
  });

  it('renders the keybinding hint footer', () => {
    const { lastFrame } = render(
      React.createElement(ProviderPicker, {
        title: 'Choose tools',
        providers: PROVIDERS,
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('j/k move');
    expect(lastFrame()).toContain('space toggle');
    expect(lastFrame()).toContain('enter confirm');
    expect(lastFrame()).toContain('esc back');
  });

  it('renders an empty state when there are no providers', () => {
    const { lastFrame } = render(
      React.createElement(ProviderPicker, {
        title: 'Choose tools',
        providers: [],
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('No tools available');
  });

  it('auto-selects the only provider when providers.length is 1', () => {
    const { lastFrame } = render(
      React.createElement(ProviderPicker, {
        title: 'Choose tools',
        providers: [{ id: 'opencode', label: 'OpenCode' }],
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).toContain('> [x] OpenCode');
  });

  it('does not auto-select when there are no providers', () => {
    const { lastFrame } = render(
      React.createElement(ProviderPicker, {
        title: 'Choose tools',
        providers: [],
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()?.match(/\[x\]/g) ?? []).toHaveLength(0);
  });

  it('does not show the "Select at least one tool" error in the initial frame', () => {
    const { lastFrame } = render(
      React.createElement(ProviderPicker, {
        title: 'Choose tools',
        providers: PROVIDERS,
        onConfirm: () => {},
        onBack: () => {},
      }),
    );
    expect(lastFrame()).not.toContain('Select at least one tool');
  });
});

