export interface KeyInfo {
  backspace?: boolean;
  delete?: boolean;
  escape?: boolean;
  return?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
}

export interface TextState {
  value: string;
  cursor: number;
}

export function applyKeyToText(state: TextState, input: string, key: KeyInfo): TextState {
  if (key.escape || key.return) {
    return state;
  }

  if (key.leftArrow) {
    return { value: state.value, cursor: Math.max(0, state.cursor - 1) };
  }

  if (key.rightArrow) {
    return { value: state.value, cursor: Math.min(state.value.length, state.cursor + 1) };
  }

  if (key.backspace || key.delete || input === '\b' || input === '\x7f') {
    if (state.cursor === 0) return state;
    const newValue = state.value.slice(0, state.cursor - 1) + state.value.slice(state.cursor);
    return { value: newValue, cursor: state.cursor - 1 };
  }

  if (input && !key.ctrl && !key.meta) {
    const newValue = state.value.slice(0, state.cursor) + input + state.value.slice(state.cursor);
    return { value: newValue, cursor: state.cursor + input.length };
  }

  return state;
}
