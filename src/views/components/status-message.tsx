import React from 'react';
import { Box, Text } from 'ink';

export type StatusKind = 'info' | 'error' | 'success';

export interface StatusMessageProps {
  kind: StatusKind;
  text: string;
}

const COLORS: Record<StatusKind, string> = {
  info: 'cyan',
  error: 'red',
  success: 'green',
};

const ICONS: Record<StatusKind, string> = {
  info: 'i',
  error: '!',
  success: 'OK',
};

export const StatusMessage: React.FC<StatusMessageProps> = ({ kind, text }) =>
  React.createElement(
    Box,
    null,
    React.createElement(Text, { color: COLORS[kind] }, `[${ICONS[kind]}] ${text}`),
  );
