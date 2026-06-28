import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { KEY_UP, KEY_DOWN, KEY_ENTER, KEY_ESC, KEY_J, KEY_K } from '../../controllers/keybindings.js';

export interface MainMenuOption {
  id: string;
  label: string;
  description?: string;
}

export interface MainMenuProps {
  options: ReadonlyArray<MainMenuOption>;
  canGoBack: boolean;
  onSelect: (id: string) => void;
  onBack: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ options, canGoBack, onSelect, onBack }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow || input === KEY_UP || input === KEY_K) {
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow || input === KEY_DOWN || input === KEY_J) {
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (key.return || input === KEY_ENTER) {
      const opt = options[activeIndex];
      if (opt) onSelect(opt.id);
    } else if (key.escape || input === KEY_ESC) {
      onBack();
    } else if (input === 'q' && !canGoBack) {
      onBack();
    }
  });

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(Text, { bold: true }, 'ezskills'),
    React.createElement(Text, { dimColor: true }, 'Manage skills for OpenCode and OpenClaw'),
    React.createElement(Text, null, ''),
    options.map((opt, idx) => {
      const isActive = idx === activeIndex;
      const cursor = isActive ? '> ' : '  ';
      return React.createElement(
        Box,
        { key: opt.id, flexDirection: 'column' },
        React.createElement(
          Text,
          { color: isActive ? 'cyan' : undefined, bold: isActive },
          `${cursor}${opt.label}`,
        ),
        opt.description
          ? React.createElement(Text, { dimColor: true, color: isActive ? 'cyan' : undefined }, `    ${opt.description}`)
          : null,
      );
    }),
    React.createElement(Text, null, ''),
    React.createElement(
      Text,
      { dimColor: true },
      canGoBack ? 'esc to go back  j/k move  enter select' : 'esc/q to exit  j/k move  enter select',
    ),
  );
};
