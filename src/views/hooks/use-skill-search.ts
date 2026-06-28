import { useMemo } from 'react';
import { SearchService } from '../../services/search/search-service.js';
import type { IndexedSkill } from '../../types/index.js';

const searchService = new SearchService();

export function useSkillSearch(skills: IndexedSkill[], query: string): IndexedSkill[] {
  return useMemo(
    () => searchService.search(skills, query),
    [skills, query],
  );
}
