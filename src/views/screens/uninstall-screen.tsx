import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { SelectableList, type SelectableListItem } from '../components/selectable-list.js';
import { ConfirmDialog } from '../components/confirm-dialog.js';
import { KEY_UP, KEY_DOWN, KEY_SPACE, KEY_ENTER, KEY_ESC, KEY_TAB, KEY_J, KEY_K, KEY_G_TOP, KEY_G_BOTTOM } from '../../controllers/keybindings.js';
import type { IndexedSkill, InstalledSkill, Scope } from '../../types/index.js';
import { sortByName, windowItems } from '../pagination.js';

export interface UninstallScreenProps {
  installed: InstalledSkill[];
  available: IndexedSkill[];
  scope: Scope;
  onScopeChange: (s: Scope) => void;
  onConfirm: (skills: InstalledSkill[]) => void;
  onBack: () => void;
}

export const UninstallScreen: React.FC<UninstallScreenProps> = ({
  installed,
  available,
  scope,
  onScopeChange,
  onConfirm,
  onBack,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  const descriptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const skill of available) {
      if (skill.description.length > 0) {
        map.set(skill.name, skill.description);
      }
    }
    return map;
  }, [available]);

  const sorted = sortByName(installed);

  const items: SelectableListItem[] = sorted.map((s) => ({
    id: s.name,
    title: s.name,
    subtitle: descriptions.get(s.name) ?? '',
  }));

  const { visible: visibleItems, offset } = windowItems(items, activeIndex, 5, 5);
  const windowedActiveIndex = activeIndex - offset;

  useInput((input, key) => {
    if (confirming) return;
    if (key.escape || input === KEY_ESC) {
      onBack();
      return;
    }
    if (key.tab || input === KEY_TAB) onScopeChange(scope === 'global' ? 'local' : 'global');
    else if (key.upArrow || input === KEY_UP || input === KEY_K) {
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow || input === KEY_DOWN || input === KEY_J) {
      setActiveIndex((i) => Math.min(Math.max(0, items.length - 1), i + 1));
    } else if (input === KEY_G_TOP) {
      setActiveIndex(0);
    } else if (input === KEY_G_BOTTOM) {
      setActiveIndex(Math.max(0, items.length - 1));
    } else if (input === ' ' || input === KEY_SPACE) {
      const item = items[activeIndex];
      if (item) {
        const next = new Set(selected);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        setSelected(next);
      }
    } else if (key.return || input === KEY_ENTER) {
      if (selected.size === 0) return;
      setConfirming(true);
    }
  });

  if (confirming) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { bold: true }, 'Uninstall Skills'),
      React.createElement(
        Text,
        null,
        React.createElement(Text, { dimColor: true }, '  Scope: '),
        React.createElement(
          Text,
          { bold: true, color: scope === 'global' ? 'yellow' : 'green' },
          scope === 'global' ? 'Global' : 'Local',
        ),
        scope === 'global'
          ? React.createElement(Text, { dimColor: true }, ' (not recommended)')
          : null,
        React.createElement(Text, { dimColor: true }, '   (Tab to switch)'),
      ),
      React.createElement(ConfirmDialog, {
        message: `Uninstall ${selected.size} skill(s)?`,
        onConfirm: () => {
          const toUninstall = installed.filter((s) => selected.has(s.name));
          onConfirm(toUninstall);
        },
        onCancel: () => setConfirming(false),
      }),
    );
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(Text, { bold: true }, 'Uninstall Skills'),
    React.createElement(
      Text,
      null,
      React.createElement(Text, { dimColor: true }, '  Scope: '),
      React.createElement(
        Text,
        { bold: true, color: scope === 'global' ? 'yellow' : 'green' },
        scope === 'global' ? 'Global' : 'Local',
      ),
      scope === 'global'
        ? React.createElement(Text, { dimColor: true }, ' (not recommended)')
        : null,
      React.createElement(Text, { dimColor: true }, '   (Tab to switch)'),
    ),
    React.createElement(
      Text,
      { dimColor: true },
      '  j/k move  g/G top/bottom  space select  enter confirm  esc back  Tab switch',
    ),
    items.length === 0
      ? React.createElement(Text, { dimColor: true }, 'No skills installed')
      :     React.createElement(SelectableList, {
          items: visibleItems,
          activeIndex: windowedActiveIndex,
          selectedIds: selected,
          onToggle: (id: string) => {
            const next = new Set(selected);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setSelected(next);
          },
        }),
    React.createElement(
      Text,
      { dimColor: true },
      items.length === 0
        ? ''
        : `  ${offset + 1}-${Math.min(offset + visibleItems.length, items.length)} of ${items.length}`,
    ),
  );
};
