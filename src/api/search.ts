import type {
  AdvancedSearchBody,
  SearchPagedResult,
  SimpleSearchParams,
} from '@/types';
import { apiClient } from './apiClient';
import { useInfiniteQuery } from '@tanstack/react-query';

export const searchApi = {
  simple: (params: SimpleSearchParams, mode: boolean = false) =>
    apiClient.get<SearchPagedResult, SimpleSearchParams>(
      `/search${mode ? '?hiddenIsAvailableMode=true' : ''}`,
      params
    ),
  advanced: (body: AdvancedSearchBody, mode: boolean = false) =>
    apiClient.post<SearchPagedResult, AdvancedSearchBody>(
      `/search/advanced${mode ? '?hiddenIsAvailableMode=true' : ''}`,
      body
    ), //Почему в одном случае гет, а в дргуом пост?
};

type SearchCursor =
  | {
      //Зачем здесь вертикальный слеш?
      lastBestSimilarity: number;
      lastId: number;
    }
  | undefined;

export const useInfiniteSimpleSearch = (
  query: string,
  pageSize = 20,
  enabled = true,
  mode: boolean = false
) => {
  //Внутри каждого компонента будет свой инстанс функции или общий?
  return useInfiniteQuery({
    queryKey: ['search', 'simple', query, pageSize, mode],
    queryFn: ({ pageParam }) =>
      searchApi.simple(
        {
          query,
          pageSize,
          lastBestSimilarity: pageParam?.lastBestSimilarity,
          lastId: pageParam?.lastId,
        },
        mode
      ),
    initialPageParam: undefined as SearchCursor,
    getNextPageParam: (lastPage): SearchCursor => {
      if (
        !lastPage.hasNext ||
        lastPage.lastBestSimilarity === null ||
        lastPage.lastId === null
      )
        return undefined;
      return {
        lastBestSimilarity: lastPage.lastBestSimilarity,
        lastId: lastPage.lastId,
      };
    },
    enabled: enabled && query.trim().length > 0,
  });
};

export const useInfiniteAdvancedSearch = (
  query: string,
  filters: Omit<
    AdvancedSearchBody,
    'query' | 'pageSize' | 'lastBestSimilarity' | 'lastId'
  >,
  pageSize = 20,
  enabled = true,
  mode = false
) => {
  return useInfiniteQuery({
    queryKey: ['search', 'advanced', query, pageSize, filters, mode],
    queryFn: ({ pageParam }) =>
      searchApi.advanced(
        {
          query,
          pageSize,
          lastBestSimilarity: pageParam?.lastBestSimilarity ?? null,
          lastId: pageParam?.lastId ?? null,
          ...filters,
        },
        mode
      ),
    initialPageParam: undefined as SearchCursor,
    getNextPageParam: (lastPage): SearchCursor => {
      if (
        !lastPage.hasNext ||
        lastPage.lastBestSimilarity === null ||
        lastPage.lastId === null
      )
        return undefined;
      return {
        lastBestSimilarity: lastPage.lastBestSimilarity,
        lastId: lastPage.lastId,
      };
    },
    enabled: enabled,
  });
};
