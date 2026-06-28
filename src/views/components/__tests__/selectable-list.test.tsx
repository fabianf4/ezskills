import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { SelectableList } from '../selectable-list.js';

describe('SelectableList', () => {
  it('shows empty state when no items', () => {
    const { lastFrame } = render(
      React.createElement(SelectableList, {
        items: [],
        activeIndex: 0,
        selectedIds: new Set<string>(),
        onToggle: () => {},
      }),
    );
    expect(lastFrame()).toContain('No items');
  });

  it('renders item titles', () => {
    const { lastFrame } = render(
      React.createElement(SelectableList, {
        items: [
          { id: 'a', title: 'Alpha', subtitle: 'first' },
          { id: 'b', title: 'Beta', subtitle: 'second' },
        ],
        activeIndex: 0,
        selectedIds: new Set<string>(),
        onToggle: () => {},
      }),
    );
    expect(lastFrame()).toContain('Alpha');
    expect(lastFrame()).toContain('Beta');
  });

  it('only shows subtitle of the active item', () => {
    const { lastFrame } = render(
      React.createElement(SelectableList, {
        items: [
          { id: 'a', title: 'Alpha', subtitle: 'first desc' },
          { id: 'b', title: 'Beta', subtitle: 'second desc' },
          { id: 'c', title: 'Gamma', subtitle: 'third desc' },
        ],
        activeIndex: 1,
        selectedIds: new Set<string>(),
        onToggle: () => {},
      }),
    );
    const frame = lastFrame()!;
    expect(frame).toContain('second desc');
    expect(frame).not.toContain('first desc');
    expect(frame).not.toContain('third desc');
  });

  it('updates subtitle when active item changes', () => {
    const { lastFrame, rerender } = render(
      React.createElement(SelectableList, {
        items: [
          { id: 'a', title: 'Alpha', subtitle: 'first' },
          { id: 'b', title: 'Beta', subtitle: 'second' },
        ],
        activeIndex: 0,
        selectedIds: new Set<string>(),
        onToggle: () => {},
      }),
    );
    expect(lastFrame()).toContain('first');
    expect(lastFrame()).not.toContain('second');
    rerender(
      React.createElement(SelectableList, {
        items: [
          { id: 'a', title: 'Alpha', subtitle: 'first' },
          { id: 'b', title: 'Beta', subtitle: 'second' },
        ],
        activeIndex: 1,
        selectedIds: new Set<string>(),
        onToggle: () => {},
      }),
    );
    expect(lastFrame()).toContain('second');
    expect(lastFrame()).not.toContain('first');
  });

  it('marks selected items', () => {
    const { lastFrame } = render(
      React.createElement(SelectableList, {
        items: [{ id: 'a', title: 'A' }],
        activeIndex: 0,
        selectedIds: new Set(['a']),
        onToggle: () => {},
      }),
    );
    expect(lastFrame()).toContain('[x]');
  });

  it('shows unchecked marker for non-selected', () => {
    const { lastFrame } = render(
      React.createElement(SelectableList, {
        items: [{ id: 'a', title: 'A' }],
        activeIndex: 0,
        selectedIds: new Set<string>(),
        onToggle: () => {},
      }),
    );
    expect(lastFrame()).toContain('[ ]');
  });

  it('highlights the active item with > cursor', () => {
    const { lastFrame } = render(
      React.createElement(SelectableList, {
        items: [
          { id: 'a', title: 'A' },
          { id: 'b', title: 'B' },
        ],
        activeIndex: 0,
        selectedIds: new Set<string>(),
        onToggle: () => {},
      }),
    );
    expect(lastFrame()).toContain('>');
  });

  it('renders ✓ installed suffix on items whose id is in installedIds', () => {
    const { lastFrame } = render(
      React.createElement(SelectableList, {
        items: [
          { id: 'a', title: 'Alpha' },
          { id: 'b', title: 'Beta' },
        ],
        activeIndex: 0,
        selectedIds: new Set<string>(),
        installedIds: new Set(['a']),
        onToggle: () => {},
      }),
    );
    const frame = lastFrame()!;
    expect(frame).toContain('Alpha');
    expect(frame).toContain('✓ installed');
  });

  it('does not render ✓ installed on non-installed items', () => {
    const { lastFrame } = render(
      React.createElement(SelectableList, {
        items: [
          { id: 'a', title: 'Alpha' },
          { id: 'b', title: 'Beta' },
        ],
        activeIndex: 0,
        selectedIds: new Set<string>(),
        installedIds: new Set(['a']),
        onToggle: () => {},
      }),
    );
    const lines = lastFrame()!.split('\n');
    const betaLine = lines.find((l) => l.includes('Beta')) ?? '';
    expect(betaLine).not.toContain('✓ installed');
  });

  it('does not render installed marker when installedIds is undefined', () => {
    const { lastFrame } = render(
      React.createElement(SelectableList, {
        items: [{ id: 'a', title: 'Alpha' }],
        activeIndex: 0,
        selectedIds: new Set<string>(),
        onToggle: () => {},
      }),
    );
    expect(lastFrame()).not.toContain('✓ installed');
  });

  it('does not show [x] on installed items even if id is in selectedIds', () => {
    const { lastFrame } = render(
      React.createElement(SelectableList, {
        items: [{ id: 'a', title: 'Alpha' }],
        activeIndex: 0,
        selectedIds: new Set(['a']),
        installedIds: new Set(['a']),
        onToggle: () => {},
      }),
    );
    expect(lastFrame()).not.toContain('[x]');
  });
});
