import type { IndexedSkill, Scope } from '../types/index.js';
import { SearchService } from '../services/search/search-service.js';

export class InstallState {
  private selected: Set<string> = new Set();
  private query: string = '';
  private scope: Scope = 'local';
  private readonly searchService: SearchService;

  constructor(searchService: SearchService = new SearchService()) {
    this.searchService = searchService;
  }

  getQuery(): string {
    return this.query;
  }

  setQuery(q: string): void {
    this.query = q;
  }

  getScope(): Scope {
    return this.scope;
  }

  setScope(s: Scope): void {
    this.scope = s;
  }

  isSelected(name: string): boolean {
    return this.selected.has(name);
  }

  toggle(name: string): void {
    if (this.selected.has(name)) {
      this.selected.delete(name);
    } else {
      this.selected.add(name);
    }
  }

  clearSelection(): void {
    this.selected.clear();
  }

  getSelectedNames(): string[] {
    return [...this.selected];
  }

  filter(available: IndexedSkill[]): IndexedSkill[] {
    return this.searchService.search(available, this.query);
  }

  isInstalled(skillName: string, installedNames: Set<string>): boolean {
    return installedNames.has(skillName);
  }
}
