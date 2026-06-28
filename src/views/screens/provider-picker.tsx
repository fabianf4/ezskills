import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { SelectableList, type SelectableListItem } from '../components/selectable-list.js';
import { StatusMessage } from '../components/status-message.js';
import { KEY_UP, KEY_DOWN, KEY_ENTER, KEY_ESC, KEY_SPACE, KEY_J, KEY_K, KEY_G_TOP, KEY_G_BOTTOM } from '../../controllers/keybindings.js';
import type { ProviderListItem } from '../../types/index.js';

export interface ProviderPickerProps {
  title: string;
  providers: ProviderListItem[];
  onConfirm: (selectedIds: string[]) => void;
  onBack: () => void;
}

export const ProviderPicker: React.FC<ProviderPickerProps> = ({
  title,
  providers,
  onConfirm,
  onBack,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => (providers.length === 1 ? new Set([providers[0]!.id]) : new Set()),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState<{ kind: 'error'; text: string } | null>(null);

  const items: SelectableListItem[] = providers.map((p) => ({
    id: p.id,
    title: p.label,
  }));

  useInput((input, key) => {
    if (key.escape || input === KEY_ESC) {
      onBack();
      return;
    }
    if (key.upArrow || input === KEY_UP || input === KEY_K) {
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow || input === KEY_DOWN || input === KEY_J) {
      setActiveIndex((i) => Math.min(Math.max(0, items.length - 1), i + 1));
      return;
    }
    if (input === KEY_G_TOP) {
      setActiveIndex(0);
      return;
    }
    if (input === KEY_G_BOTTOM) {
      setActiveIndex(Math.max(0, items.length - 1));
      return;
    }
    if (input === ' ' || input === KEY_SPACE) {
      const item = items[activeIndex];
      if (item) {
        if (status !== null) setStatus(null);
        const next = new Set(selectedIds);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        setSelectedIds(next);
      }
      return;
    }
    if (key.return || input === KEY_ENTER) {
      if (providers.length === 0) return;
      if (selectedIds.size === 0) {
        setStatus({ kind: 'error', text: 'Select at least one tool' });
        return;
      }
      onConfirm(Array.from(selectedIds));
      return;
    }
  });

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(Text, { bold: true }, title),
    providers.length === 0
      ? React.createElement(Text, { dimColor: true }, 'No tools available')
      : React.createElement(SelectableList, {
          items,
          activeIndex,
          selectedIds,
          onToggle: () => {},
        }),
    status ? React.createElement(StatusMessage, status) : null,
    React.createElement(
      Text,
      { dimColor: true },
      '  j/k move  g/G top/bottom  space toggle  enter confirm  esc back',
    ),
  );
};
