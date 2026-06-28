import { describe, it, expect } from 'vitest';
import { sortByName, windowItems } from '../pagination.js';

describe('sortByName', () => {
  it('returns a new array sorted alphabetically by name', () => {
    const items = [
      { name: 'zod' },
      { name: 'axios' },
      { name: 'react' },
      { name: 'vitest' },
    ];
    const sorted = sortByName(items);
    expect(sorted.map((i) => i.name)).toEqual(['axios', 'react', 'vitest', 'zod']);
  });

  it('does not mutate the original array', () => {
    const items = [{ name: 'b' }, { name: 'a' }];
    const ref = items;
    sortByName(items);
    expect(ref).toBe(items);
    expect(items[0]?.name).toBe('b');
  });

  it('handles empty array', () => {
    expect(sortByName([])).toEqual([]);
  });

  it('uses locale-aware comparison', () => {
    const items = [{ name: 'É' }, { name: 'a' }, { name: 'Z' }];
    const sorted = sortByName(items);
    expect(sorted[0]?.name).toBe('a');
  });
});

describe('windowItems', () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ name: `skill-${i}` }));

  it('returns first 11 when activeIndex is 0', () => {
    const { visible, offset } = windowItems(items, 0, 5, 5);
    expect(visible).toHaveLength(11);
    expect(offset).toBe(0);
    expect(visible[0]?.name).toBe('skill-0');
    expect(visible[10]?.name).toBe('skill-10');
  });

  it('keeps active in the middle with 5 before and 5 after', () => {
    const { visible, offset } = windowItems(items, 15, 5, 5);
    expect(visible).toHaveLength(11);
    expect(offset).toBe(10);
    expect(visible[0]?.name).toBe('skill-10');
    expect(visible[5]?.name).toBe('skill-15');
    expect(visible[10]?.name).toBe('skill-20');
  });

  it('clamps to the end when activeIndex is near the end', () => {
    const { visible, offset } = windowItems(items, 29, 5, 5);
    expect(visible).toHaveLength(11);
    expect(offset).toBe(19);
    expect(visible[0]?.name).toBe('skill-19');
    expect(visible[10]?.name).toBe('skill-29');
  });

  it('handles lists shorter than the window', () => {
    const small = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
    const { visible, offset } = windowItems(small, 0, 5, 5);
    expect(visible).toHaveLength(3);
    expect(offset).toBe(0);
  });

  it('handles empty list', () => {
    const { visible, offset } = windowItems([], 0, 5, 5);
    expect(visible).toEqual([]);
    expect(offset).toBe(0);
  });
});
