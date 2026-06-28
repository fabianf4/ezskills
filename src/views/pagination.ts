export interface NamedItem {
  name: string;
}

export function sortByName<T extends NamedItem>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

export interface WindowResult<T> {
  visible: T[];
  offset: number;
}

export function windowItems<T>(
  items: T[],
  activeIndex: number,
  before: number,
  after: number,
): WindowResult<T> {
  if (items.length === 0) {
    return { visible: [], offset: 0 };
  }

  const length = items.length;

  let start = activeIndex - before;
  let end = activeIndex + after + 1;

  if (start < 0) {
    end = Math.min(length, end - start);
    start = 0;
  }
  if (end > length) {
    start = Math.max(0, start - (end - length));
    end = length;
  }

  return {
    visible: items.slice(start, end),
    offset: start,
  };
}
