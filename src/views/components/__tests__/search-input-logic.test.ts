import { describe, it, expect } from 'vitest';
import { applyKeyToText, type TextState, type KeyInfo } from '../search-input-logic.js';

const bs: KeyInfo = { backspace: true };
const esc: KeyInfo = { escape: true };
const ret: KeyInfo = { return: true };
const left: KeyInfo = { leftArrow: true };
const right: KeyInfo = { rightArrow: true };
const ctrl: KeyInfo = { ctrl: true };
const del: KeyInfo = { delete: true };

describe('applyKeyToText - backspace (delete last character)', () => {
  it('removes the char before cursor when cursor is at end', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 5 }, '', bs))
      .toEqual<TextState>({ value: 'hell', cursor: 4 });
  });

  it('removes the char before cursor when cursor is in the middle', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 3 }, '', bs))
      .toEqual<TextState>({ value: 'helo', cursor: 2 });
  });

  it('does nothing when cursor is at start', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 0 }, '', bs))
      .toEqual<TextState>({ value: 'hello', cursor: 0 });
  });

  it('treats \\b input as backspace', () => {
    expect(applyKeyToText({ value: 'abc', cursor: 3 }, '\b', {}))
      .toEqual<TextState>({ value: 'ab', cursor: 2 });
  });

  it('treats \\x7f (DEL) input as backspace', () => {
    expect(applyKeyToText({ value: 'abc', cursor: 3 }, '\x7f', {}))
      .toEqual<TextState>({ value: 'ab', cursor: 2 });
  });
});

describe('applyKeyToText - delete key (DEL treated as backspace)', () => {
  it('removes the last char when cursor is at end', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 5 }, '', del))
      .toEqual<TextState>({ value: 'hell', cursor: 4 });
  });

  it('removes the char before cursor when cursor is in the middle', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 3 }, '', del))
      .toEqual<TextState>({ value: 'helo', cursor: 2 });
  });

  it('does nothing when cursor is at start', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 0 }, '', del))
      .toEqual<TextState>({ value: 'hello', cursor: 0 });
  });
});

describe('applyKeyToText - arrow keys', () => {
  it('moves cursor left', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 3 }, '', left))
      .toEqual<TextState>({ value: 'hello', cursor: 2 });
  });

  it('clamps cursor at 0 on leftArrow', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 0 }, '', left))
      .toEqual<TextState>({ value: 'hello', cursor: 0 });
  });

  it('moves cursor right', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 2 }, '', right))
      .toEqual<TextState>({ value: 'hello', cursor: 3 });
  });

  it('clamps cursor at end on rightArrow', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 5 }, '', right))
      .toEqual<TextState>({ value: 'hello', cursor: 5 });
  });
});

describe('applyKeyToText - insert', () => {
  it('inserts at cursor in the middle', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 2 }, 'X', {}))
      .toEqual<TextState>({ value: 'heXllo', cursor: 3 });
  });

  it('inserts at start when cursor is 0', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 0 }, 'X', {}))
      .toEqual<TextState>({ value: 'Xhello', cursor: 1 });
  });

  it('inserts at end when cursor is at end', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 5 }, 'X', {}))
      .toEqual<TextState>({ value: 'helloX', cursor: 6 });
  });

  it('inserts multi-character input (paste)', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 2 }, 'XYZ', {}))
      .toEqual<TextState>({ value: 'heXYZllo', cursor: 5 });
  });
});

describe('applyKeyToText - Ctrl shortcuts are ignored', () => {
  it('Ctrl+U does not clear the text', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 3 }, 'u', ctrl))
      .toEqual<TextState>({ value: 'hello', cursor: 3 });
  });

  it('Ctrl+W does not delete a word', () => {
    expect(applyKeyToText({ value: 'hello world', cursor: 11 }, 'w', ctrl))
      .toEqual<TextState>({ value: 'hello world', cursor: 11 });
  });
});

describe('applyKeyToText - passthrough', () => {
  it('returns the same state on escape', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 2 }, '', esc))
      .toEqual<TextState>({ value: 'hello', cursor: 2 });
  });

  it('returns the same state on return', () => {
    expect(applyKeyToText({ value: 'hello', cursor: 2 }, '', ret))
      .toEqual<TextState>({ value: 'hello', cursor: 2 });
  });

  it('ignores empty input with no special key', () => {
    expect(applyKeyToText({ value: 'ab', cursor: 2 }, '', {}))
      .toEqual<TextState>({ value: 'ab', cursor: 2 });
  });
});
