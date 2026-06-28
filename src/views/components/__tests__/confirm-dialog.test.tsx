import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { ConfirmDialog } from '../confirm-dialog.js';

describe('ConfirmDialog', () => {
  it('renders the message', () => {
    const { lastFrame } = render(
      React.createElement(ConfirmDialog, {
        message: 'Are you sure?',
        onConfirm: () => {},
        onCancel: () => {},
      }),
    );
    expect(lastFrame()).toContain('Are you sure?');
  });

  it('renders Y/N prompt', () => {
    const { lastFrame } = render(
      React.createElement(ConfirmDialog, {
        message: 'Sure?',
        onConfirm: () => {},
        onCancel: () => {},
      }),
    );
    expect(lastFrame()).toContain('Y');
    expect(lastFrame()).toContain('N');
  });
});
