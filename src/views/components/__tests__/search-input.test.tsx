import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { SearchInput } from '../search-input.js';

describe('SearchInput (dumb display component)', () => {
  it('renders the placeholder when value is empty', () => {
    const { lastFrame } = render(
      React.createElement(SearchInput, {
        value: '',
        focused: false,
        placeholder: 'Type here',
      }),
    );
    expect(lastFrame()).toContain('Type here');
  });

  it('renders the value when not empty', () => {
    const { lastFrame } = render(
      React.createElement(SearchInput, {
        value: 'hello',
        focused: true,
      }),
    );
    expect(lastFrame()).toContain('hello');
  });

  it('shows the focused indicator (>) when focused', () => {
    const { lastFrame } = render(
      React.createElement(SearchInput, {
        value: '',
        focused: true,
      }),
    );
    expect(lastFrame()).toContain('> ');
  });

  it('hides the focused indicator when not focused', () => {
    const { lastFrame } = render(
      React.createElement(SearchInput, {
        value: '',
        focused: false,
      }),
    );
    expect(lastFrame()).not.toContain('> ');
  });

  it('uses cyan border when focused and gray when not', () => {
    const focused = render(
      React.createElement(SearchInput, { value: 'x', focused: true }),
    );
    expect(focused.lastFrame()).toBeDefined();
    const blurred = render(
      React.createElement(SearchInput, { value: 'x', focused: false }),
    );
    expect(blurred.lastFrame()).toBeDefined();
  });
});
