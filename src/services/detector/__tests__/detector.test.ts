import { describe, it, expect } from 'vitest';
import { StubDetector } from '../stub-detector.js';
import { DetectorFactory } from '../detector.factory.js';

describe('StubDetector', () => {
  it('returns empty result for any path', async () => {
    const detector = new StubDetector();
    const result = await detector.detect('/some/project');
    expect(result).toEqual({ technologies: [], suggestedSkillNames: [] });
  });
});

describe('DetectorFactory', () => {
  it('creates a StubDetector for "stub"', () => {
    const factory = new DetectorFactory();
    const detector = factory.create('stub');
    expect(detector).toBeInstanceOf(StubDetector);
  });

  it('throws for unknown detector id', () => {
    const factory = new DetectorFactory();
    expect(() =>
      factory.create('unknown' as 'stub'),
    ).toThrow(/unknown detector/i);
  });
});
