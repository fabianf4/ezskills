import React from 'react';
import { Box, Text } from 'ink';

export interface SearchInputProps {
  value: string;
  placeholder?: string;
  focused?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  placeholder = 'Search... (press s to focus)',
  focused = true,
}) => {
  return React.createElement(
    Box,
    { borderStyle: 'round', borderColor: focused ? 'cyan' : 'gray', paddingX: 1 },
    React.createElement(
      Text,
      null,
      focused ? '> ' : '  ',
      value.length > 0
        ? value
        : React.createElement(Text, { dimColor: true }, placeholder),
    ),
  );
};
