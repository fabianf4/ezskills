import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { StatusMessage } from '../status-message.js';

describe('StatusMessage', () => {
  it('renders info kind', () => {
    const { lastFrame } = render(
      React.createElement(StatusMessage, { kind: 'info', text: 'hello' }),
    );
    expect(lastFrame()).toContain('hello');
    expect(lastFrame()).toContain('[i]');
  });

  it('renders error kind', () => {
    const { lastFrame } = render(
      React.createElement(StatusMessage, { kind: 'error', text: 'oops' }),
    );
    expect(lastFrame()).toContain('oops');
    expect(lastFrame()).toContain('[!]');
  });

  it('renders success kind', () => {
    const { lastFrame } = render(
      React.createElement(StatusMessage, { kind: 'success', text: 'done' }),
    );
    expect(lastFrame()).toContain('done');
    expect(lastFrame()).toContain('[OK]');
  });
});
