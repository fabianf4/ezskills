import React from 'react';
import { Box, Text } from 'ink';
import { StatusMessage } from '../components/status-message.js';
import type { IndexedSkill } from '../../types/index.js';

export interface AutoDetectResultProps {
  loading: boolean;
  technologies: string[];
  suggested: IndexedSkill[];
  onConfirm: (skills: IndexedSkill[]) => void;
  onBack: () => void;
}

export const AutoDetectResult: React.FC<AutoDetectResultProps> = ({
  loading,
  technologies,
  suggested,
}) => {
  if (loading) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { bold: true }, 'Auto-detect'),
      React.createElement(StatusMessage, { kind: 'info', text: 'Detecting technologies...' }),
    );
  }

  if (technologies.length === 0) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { bold: true }, 'Auto-detect'),
      React.createElement(StatusMessage, { kind: 'info', text: 'No technologies detected.' }),
      React.createElement(Text, { dimColor: true }, 'Press esc to go back'),
    );
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(Text, { bold: true }, 'Auto-detect'),
    React.createElement(Text, null, `Detected: ${technologies.join(', ')}`),
    React.createElement(Text, null, ''),
    React.createElement(Text, null, 'Suggested skills:'),
    suggested.map((s) =>
      React.createElement(
        Box,
        { key: s.name, flexDirection: 'column' },
        React.createElement(Text, null, `  - ${s.name}`),
        React.createElement(Text, { dimColor: true }, `    ${s.description}`),
      ),
    ),
    React.createElement(Text, { dimColor: true }, 'Press enter to install all, esc to go back'),
  );
};
