import React from 'react';
import { Box, Text } from 'ink';

export interface SelectableListItem {
  id: string;
  title: string;
  subtitle?: string;
}

export interface SelectableListProps {
  items: SelectableListItem[];
  activeIndex: number;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  installedIds?: Set<string>;
}

export const SelectableList: React.FC<SelectableListProps> = ({
  items,
  activeIndex,
  selectedIds,
  installedIds,
}) => {
  if (items.length === 0) {
    return React.createElement(Box, { flexDirection: 'column' },
      React.createElement(Text, { dimColor: true }, 'No items to show'),
    );
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    items.map((item, idx) => {
      const isActive = idx === activeIndex;
      const isInstalled = installedIds?.has(item.id) === true;
      const isSelected = !isInstalled && selectedIds.has(item.id);
      const cursor = isActive ? '> ' : '  ';
      const check = isSelected ? '[x]' : '[ ]';

      return React.createElement(
        Box,
        { key: item.id, flexDirection: 'column' },
        React.createElement(
          Text,
          isInstalled
            ? { dimColor: true }
            : { color: isActive ? 'cyan' : undefined, bold: isActive },
          `${cursor}${check} ${item.title}`,
          isInstalled
            ? React.createElement(Text, { dimColor: true }, ' ✓ installed')
            : null,
        ),
        isActive && item.subtitle
          ? React.createElement(
              Text,
              isInstalled
                ? { dimColor: true }
                : { dimColor: true, color: 'cyan' },
              `    ${item.subtitle}`,
            )
          : null,
      );
    }),
  );
};
