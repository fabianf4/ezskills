import React from 'react';
import { Box, Text, useInput } from 'ink';
import { KEY_Y, KEY_N } from '../../controllers/keybindings.js';

export interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) => {
  useInput((input) => {
    if (input === KEY_Y || input === 'Y') onConfirm();
    else if (input === KEY_N || input === 'N' || input === '\x1b') onCancel();
  });

  return React.createElement(
    Box,
    { flexDirection: 'column', borderStyle: 'round', borderColor: 'yellow', paddingX: 1 },
    React.createElement(Text, null, message),
    React.createElement(Text, { dimColor: true }, 'Press Y to confirm, N to cancel'),
  );
};
