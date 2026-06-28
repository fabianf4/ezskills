import { describe, it, expect } from 'vitest';
import {
  KEY_S,
  KEY_TAB,
  KEY_J,
  KEY_K,
  KEY_G_TOP,
  KEY_G_BOTTOM,
  KEY_UP,
  KEY_DOWN,
  KEY_ESC,
  KEY_ENTER,
} from '../keybindings.js';

describe('keybindings constants', () => {
  it('search focus key is s', () => {
    expect(KEY_S).toBe('s');
  });

  it('scope toggle key is Tab', () => {
    expect(KEY_TAB).toBe('tab');
  });

  it('vim navigation keys match conventions', () => {
    expect(KEY_J).toBe('j');
    expect(KEY_K).toBe('k');
    expect(KEY_G_TOP).toBe('g');
    expect(KEY_G_BOTTOM).toBe('G');
  });

  it('legacy key names are preserved', () => {
    expect(KEY_UP).toBe('up');
    expect(KEY_DOWN).toBe('down');
    expect(KEY_ESC).toBe('escape');
    expect(KEY_ENTER).toBe('return');
  });
});
