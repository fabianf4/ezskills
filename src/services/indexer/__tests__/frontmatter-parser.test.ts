import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../frontmatter-parser.js';

describe('parseFrontmatter', () => {
  it('extracts name and description from valid frontmatter', () => {
    const content = `---
name: zod
description: Zod schema validation
---

# Zod skill`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({
      name: 'zod',
      description: 'Zod schema validation',
    });
  });

  it('returns null when no frontmatter present', () => {
    const content = `# Just a title

Some content without frontmatter.`;
    expect(parseFrontmatter(content)).toBeNull();
  });

  it('returns null when frontmatter is malformed (no closing ---)', () => {
    const content = `---
name: broken
description: missing closing
# Zod skill`;
    expect(parseFrontmatter(content)).toBeNull();
  });

  it('handles multiline description with literal block scalar', () => {
    const content = `---
name: react
description: |
  A multi-line
  description with
  several lines.
---

# React`;
    const result = parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('react');
    expect(result?.description).toContain('A multi-line');
    expect(result?.description).toContain('several lines');
  });

  it('trims whitespace and newlines from description', () => {
    const content = `---
name: next
description: "  Next.js framework  "

---`;
    const result = parseFrontmatter(content);
    expect(result?.description).toBe('Next.js framework');
  });

  it('handles frontmatter with only name (no description)', () => {
    const content = `---
name: solo
---`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({ name: 'solo', description: '' });
  });

  it('handles description as quoted string with special chars', () => {
    const content = `---
name: ts
description: "TypeScript: typed superset of JavaScript"
---`;
    const result = parseFrontmatter(content);
    expect(result?.description).toBe('TypeScript: typed superset of JavaScript');
  });

  it('returns null when content is empty', () => {
    expect(parseFrontmatter('')).toBeNull();
  });

  it('does not treat --- in body as start of frontmatter', () => {
    const content = `Some text
---
body content
---`;
    expect(parseFrontmatter(content)).toBeNull();
  });

  it('returns null when YAML parses to a non-object (e.g. just a number)', () => {
    const content = `---
42
---`;
    expect(parseFrontmatter(content)).toBeNull();
  });

  it('returns null when name is missing or empty', () => {
    expect(parseFrontmatter('---\ndescription: only desc\n---\n')).toBeNull();
    expect(parseFrontmatter('---\nname: ""\n---\n')).toBeNull();
  });

  it('handles Windows-style line endings (\\r\\n)', () => {
    const content = '---\r\nname: zod\r\ndescription: Zod\r\n---\r\n';
    const result = parseFrontmatter(content);
    expect(result).toEqual({ name: 'zod', description: 'Zod' });
  });
});
