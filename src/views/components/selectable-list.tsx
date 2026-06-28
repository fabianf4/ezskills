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
}

export const SelectableList: React.FC<SelectableListProps> = ({
  items,
  activeIndex,
  selectedIds,
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
      const isSelected = selectedIds.has(item.id);
      const cursor = isActive ? '> ' : '  ';
      const check = isSelected ? '[x]' : '[ ]';

      return React.createElement(
        Box,
        { key: item.id, flexDirection: 'column' },
        React.createElement(
          Text,
          { color: isActive ? 'cyan' : undefined, bold: isActive },
          `${cursor}${check} ${item.title}`,
        ),
        isActive && item.subtitle
          ? React.createElement(
              Text,
              { dimColor: true, color: 'cyan' },
              `    ${item.subtitle}`,
            )
          : null,
      );
    }),
  );
};
