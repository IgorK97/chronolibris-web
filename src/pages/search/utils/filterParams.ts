import type { PersonRoleFilterRequest } from '@/api/search';

export interface AdvancedFilters {
  personFilters: PersonRoleFilterRequest[];
  requiredTagIds: number[];
  excludedTagIds: number[];
  languageIds: number[];
  countryIds: number[];
  yearFrom: number | null;
  yearTo: number | null;
}

export const EMPTY_FILTERS: AdvancedFilters = {
  personFilters: [],
  countryIds: [],
  excludedTagIds: [],
  languageIds: [],
  requiredTagIds: [],
  yearFrom: null,
  yearTo: null,
};

export function filtersToParams(
  filters: AdvancedFilters,
  params: URLSearchParams
): void {
  [
    'lang',
    'country',
    'yearFrom',
    'yearTo',
    'tagIncl',
    'tagExcl',
    'person',
  ].forEach((k) => params.delete(k));

  if (filters.languageIds.length > 0)
    params.set('lang', filters.languageIds.join(','));

  if (filters.countryIds.length > 0)
    params.set('contry', filters.countryIds.join(','));

  if (filters.yearFrom !== null)
    params.set('yearFrom', String(filters.yearFrom));

  if (filters.yearTo !== null) params.set('yearTo', String(filters.yearTo));

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

  const parseYear = (key: string): number | null => {
    const raw = params.get(key);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
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
    languageIds: parseIds('lang'),
    countryIds: parseIds('country'),
    yearFrom: parseYear('yearFrom'),
    yearTo: parseYear('yearTo'),
    requiredTagIds: parseIds('tagIncl'),
    excludedTagIds: parseIds('tagExcl'),
    personFilters: parsePersonFilters(),
  };
}
