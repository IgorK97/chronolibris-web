/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/stores/globalStore';
import type { AdvancedFilters } from '@/utils/filterParams';
import { searchReferenceApi } from '@api/searchReference';

interface UseResolveFilterNamesOptions {
  filters: AdvancedFilters;
  themeId?: number;
  selectionId?: number;
  onInvalidIds?: (validFilters: AdvancedFilters) => void;
}

export function useResolveFilterNames({
  filters,
  onInvalidIds,
}: UseResolveFilterNamesOptions): { isResolving: boolean } {
  const {
    filterNamesCache,
    cachePersons,
    cacheTags,
    removePersons,
    removeTags,
  } = useStore();
  const [isResolving, setIsResolving] = useState(false);
  const prevFiltersKey = useRef('');

  useEffect(() => {
    const allPersonIds = filters.personFilters.flatMap((pf) => pf.personIds);
    const allTagIds = [...filters.requiredTagIds, ...filters.excludedTagIds];

    const filtersKey = JSON.stringify({ allPersonIds, allTagIds });
    if (filtersKey === prevFiltersKey.current) {
      return;
    }
    prevFiltersKey.current = filtersKey;
    const missingPersonIds = allPersonIds.filter(
      (id) => !filterNamesCache.persons[id]
    );
    setIsResolving(true);
    const missingTagIds = allTagIds.filter((id) => !filterNamesCache.tags[id]);
    let cancelled = false;

    if (missingPersonIds.length === 0 && missingTagIds.length === 0) {
      cancelled = true;
      setIsResolving(false);
      return;
    }

    // console.log('TUTA');
    const func = async () => {
      try {
        const resolvedPersons: Array<{ id: number; name: string }> = [];
        const notFoundPersonIds: number[] = [];
        // console.log('ZDESYA', missingTagIds);

        if (missingPersonIds.length > 0) {
          const batch =
            await searchReferenceApi.getPersonsByIds(missingPersonIds);
          // console.log('Resolved persons:', batch);
          for (const p of batch) resolvedPersons.push(p);
          const foundIds = new Set(batch.map((p) => p.id));
          for (const id of missingPersonIds) {
            if (!foundIds.has(id)) notFoundPersonIds.push(id);
          }
        }
        const resolvedTags: Array<{
          id: number;
          name: string;
          matchedName: string | null;
        }> = [];
        const notFoundTagIds: number[] = [];

        if (missingTagIds.length > 0) {
          const batch = await searchReferenceApi.getTagsByIds(missingTagIds);
          for (const t of batch) resolvedTags.push(t);

          const foundIds = new Set(batch.map((t) => t.id));

          for (const id of missingTagIds) {
            if (!foundIds.has(id)) notFoundTagIds.push(id);
          }
        }
        // console.log('cancelled:', cancelled);

        if (cancelled) return;
        if (resolvedPersons.length > 0) cachePersons(resolvedPersons);
        // console.log('Resolved tags:', resolvedTags);
        if (resolvedTags.length > 0) cacheTags(resolvedTags);

        if (notFoundPersonIds.length > 0) removePersons(notFoundPersonIds);
        if (notFoundTagIds.length > 0) removeTags(notFoundTagIds);

        const hasInvalid =
          notFoundPersonIds.length > 0 || notFoundTagIds.length > 0;

        if (hasInvalid && onInvalidIds) {
          const notFoundPersonSet = new Set(notFoundPersonIds);
          const notFoundTagSet = new Set(notFoundTagIds);

          const validFilters: AdvancedFilters = {
            ...filters,
            personFilters: filters.personFilters
              .map((pf) => ({
                ...pf,
                personIds: pf.personIds.filter(
                  (id) => !notFoundPersonSet.has(id)
                ),
              }))
              .filter((pf) => pf.personIds.length > 0),
            requiredTagIds: filters.requiredTagIds.filter(
              (id) => !notFoundTagSet.has(id)
            ),
            excludedTagIds: filters.excludedTagIds.filter(
              (id) => !notFoundTagSet.has(id)
            ),
          };
          onInvalidIds(validFilters);
        }
      } finally {
        // if (!cancelled)
        //   setIsResolving(false);
        if (!cancelled) setIsResolving(false);
      }
    };
    func();
    return () => {
      prevFiltersKey.current = '';
      cancelled = true;
    };
  }, [filters.requiredTagIds, filters.excludedTagIds, filters.personFilters]);

  return { isResolving };
}
