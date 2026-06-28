import { parse as parseYaml } from 'yaml';

export interface Frontmatter {
  name: string;
  description: string;
}

export function parseFrontmatter(content: string): Frontmatter | null {
  if (content.length === 0) {
    return null;
  }

  const startMatch = content.match(/^---\r?\n/);
  if (!startMatch) {
    return null;
  }

  const afterStart = content.slice(startMatch[0].length);
  const endMatch = afterStart.match(/\r?\n---\r?\n?/);
  if (!endMatch) {
    return null;
  }

  const yamlBlock = afterStart.slice(0, endMatch.index);
  const parsed = parseYaml(yamlBlock);

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const data = parsed as Record<string, unknown>;
  const rawName = data['name'];
  const rawDescription = data['description'];

  if (typeof rawName !== 'string' || rawName.length === 0) {
    return null;
  }

  const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';

  return {
    name: rawName.trim(),
    description,
  };
}
