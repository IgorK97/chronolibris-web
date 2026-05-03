import type { PersonRoleFilterRequest } from '@/types';

export interface AdvancedFilters {
  personFilters: PersonRoleFilterRequest[];
  requiredTagIds: number[];
  excludedTagIds: number[];
  themeId: number;
  selectionId: number;
}

export const EMPTY_FILTERS: AdvancedFilters = {
  personFilters: [],
  excludedTagIds: [],
  requiredTagIds: [],
  themeId: 0,
  selectionId: 0,
};

export function filtersToParams(
  filters: AdvancedFilters,
  params: URLSearchParams
): void {
  ['tagIncl', 'tagExcl', 'person', 'themeId', 'selectionId'].forEach((k) =>
    params.delete(k)
  );

  if (filters.themeId > 0) params.set('themeId', String(filters.themeId));
  if (filters.selectionId > 0)
    params.set('selectionId', String(filters.selectionId));

  if (filters.requiredTagIds.length > 0)
    params.set('tagIncl', filters.requiredTagIds.join(','));

  if (filters.excludedTagIds.length > 0)
    params.set('tagExcl', filters.excludedTagIds.join(','));

  if (filters.personFilters.length > 0) {
    const encoded = filters.personFilters
      .map((pf) => `${pf.roleId}:${pf.personIds.join('+')}`)
      .join(',');
    params.set('person', encoded);
  }
}

export function filtersFromParams(params: URLSearchParams): AdvancedFilters {
  const parseIds = (key: string): number[] => {
    const raw = params.get(key);
    if (!raw) return [];
    return raw
      .split(',')
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
  };

  const parsePersonFilters = (): PersonRoleFilterRequest[] => {
    const raw = params.get('person');
    if (!raw) return [];
    return raw
      .split(',')
      .map((group) => {
        const [roleStr, personStr] = group.split(':');
        const roleId = parseInt(roleStr, 10);
        const personIds = (personStr ?? '')
          .split('+')
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0);
        return { roleId, personIds };
      })
      .filter((pf) => !isNaN(pf.roleId) && pf.personIds.length > 0);
  };
  return {
    requiredTagIds: parseIds('tagIncl'),
    excludedTagIds: parseIds('tagExcl'),
    personFilters: parsePersonFilters(),
    themeId: parseInt(params.get('themeId') ?? '0', 10) || 0,
    selectionId: parseInt(params.get('selectionId') ?? '0', 10) || 0,
  };
}
