// // api/tags.ts
// import { apiClient } from './apiClient';
// import type { TagType, TagDetails, PagedResult } from '../types/types';
// import {
//   useQuery,
//   useMutation,
//   useQueryClient,
//   useInfiniteQuery,
// } from '@tanstack/react-query';

// // Фиксированные типы тегов (клиентская часть)
// export const TAG_TYPES = [
//   { id: 1, name: 'Время' },
//   { id: 2, name: 'Место' },
//   { id: 3, name: 'Социум' },
// ] as const;

// export const tagsApi = {
//   getTagTypes: () => apiClient.get<TagType[]>('/Tags/types'),

//   getTags: (
//     tagTypeId?: number | null,
//     searchTerm?: string | null,
//     page: number = 0,
//     pageSize: number = 20
//   ) => {
//     const params = new URLSearchParams();
//     if (tagTypeId) params.append('tagTypeId', tagTypeId.toString());
//     if (searchTerm) params.append('searchTerm', searchTerm);
//     params.append('page', page.toString());
//     params.append('pageSize', pageSize.toString());

//     return apiClient.get<PagedResult<TagDetails>>(`/Tags?${params.toString()}`);
//   },

//   createTag: (data: { name: string; tagTypeId: number }) =>
//     apiClient.post<number>('/Tags', data),

//   deleteTag: (tagId: number) => apiClient.delete(`/Tags/${tagId}`),
// };

// // Hooks
// export const useTagTypes = () => {
//   return useQuery({
//     queryKey: ['tagTypes'],
//     queryFn: () => tagsApi.getTagTypes(),
//     staleTime: Infinity, // Типы тегов неизменны
//   });
// };

// export const useInfiniteTags = (
//   tagTypeId?: number | null,
//   searchTerm?: string | null,
//   pageSize: number = 20
// ) => {
//   return useInfiniteQuery({
//     queryKey: ['tags', 'infinite', tagTypeId, searchTerm, pageSize],
//     queryFn: ({ pageParam = 1 }) =>
//       tagsApi.getTags(tagTypeId, searchTerm, pageParam, pageSize),
//     getNextPageParam: (lastPage, allPages) =>
//       lastPage.hasNext ? allPages.length + 1 : undefined,
//     initialPageParam: 1,
//   });
// };

// export const useTags = (
//   tagTypeId?: number | null,
//   searchTerm?: string | null,
//   page: number = 1,
//   pageSize: number = 20
// ) => {
//   return useQuery({
//     queryKey: ['tags', tagTypeId, searchTerm, page, pageSize],
//     queryFn: () => tagsApi.getTags(tagTypeId, searchTerm, page, pageSize),
//     staleTime: 2 * 60 * 1000,
//   });
// };

// export const useCreateTag = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: tagsApi.createTag,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['tags'] });
//     },
//   });
// };

// export const useDeleteTag = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: tagsApi.deleteTag,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['tags'] });
//     },
//   });
// };

// api/tags.ts
import { apiClient } from './apiClient';
import type { TagType, TagDetails, PagedResult } from '../types/types';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';

export const TAG_TYPES = [
  { id: 1, name: 'Время' },
  { id: 2, name: 'Место' },
  { id: 3, name: 'Социум' },
] as const;

// Типы отношений (синонимия — единственный тип сейчас, но структура расширяема)
export const RELATION_TYPES = [
  {
    id: 1,
    name: 'Синоним',
    description: 'Теги обозначают одно и то же понятие',
  },
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

export const tagsApi = {
  getTagTypes: () => apiClient.get<TagType[]>('/Tags/types'),

  // getRelationTypes: () =>
  //   apiClient.get<RelationType[]>('/Tags/relation-types'),

  /** Корневые теги с курсорной пагинацией. При searchTerm — плоский поиск. */
  getRootTags: (
    tagTypeId?: number | null,
    searchTerm?: string | null,
    lastId?: number | null,
    pageSize: number = 20
  ) => {
    const params: Record<string, string> = { pageSize: pageSize.toString() };
    if (tagTypeId) params.tagTypeId = tagTypeId.toString();
    if (searchTerm) params.searchTerm = searchTerm;
    if (lastId) params.lastId = lastId.toString();
    return apiClient.get<PagedResult<TagDetails>>('/Tags', params);
  },

  /** Дочерние теги конкретного родителя с курсорной пагинацией. */
  getChildTags: (
    parentId: number,
    lastId?: number | null,
    pageSize: number = 20
  ) => {
    const params: Record<string, string> = { pageSize: pageSize.toString() };
    if (lastId) params.lastId = lastId.toString();
    return apiClient.get<PagedResult<TagDetails>>(
      `/Tags/${parentId}/children`,
      params
    );
  },

  createTag: (data: {
    name: string;
    tagTypeId: number;
    parentTagId?: number | null;
    relationTypeId?: number | null;
  }) => apiClient.post<number>('/Tags', data),

  deleteTag: (tagId: number) => apiClient.delete(`/Tags/${tagId}`),
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const useTagTypes = () =>
  useQuery({
    queryKey: ['tagTypes'],
    queryFn: () => tagsApi.getTagTypes(),
    staleTime: Infinity,
  });

// export const useRelationTypes = () =>
//   useQuery({
//     queryKey: ['relationTypes'],
//     queryFn: () => tagsApi.getRelationTypes(),
//     staleTime: Infinity,
//     // Фолбэк на клиентские данные если эндпоинт ещё не готов
//     placeholderData: RELATION_TYPES as unknown as RelationType[],
//   });

/** Бесконечный список корневых тегов (или плоский поиск при наличии searchTerm). */
export const useInfiniteRootTags = (
  tagTypeId?: number | null,
  searchTerm?: string | null,
  pageSize: number = 20
) =>
  useInfiniteQuery({
    queryKey: ['tags', 'root', tagTypeId, searchTerm, pageSize],
    queryFn: ({ pageParam }) =>
      tagsApi.getRootTags(
        tagTypeId,
        searchTerm,
        pageParam as number | null,
        pageSize
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
    initialPageParam: null as number | null,
  });

/** Бесконечный список дочерних тегов конкретного родителя. */
export const useInfiniteChildTags = (
  parentId: number,
  pageSize: number = 20,
  enabled: boolean = true
) =>
  useInfiniteQuery({
    queryKey: ['tags', 'children', parentId, pageSize],
    queryFn: ({ pageParam }) =>
      tagsApi.getChildTags(parentId, pageParam as number | null, pageSize),
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
    initialPageParam: null as number | null,
    enabled,
  });

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};
