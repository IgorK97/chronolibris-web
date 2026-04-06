// api/tags.ts
import { apiClient } from './apiClient';
import type { TagType, TagDetails, PagedResult } from '../types/types';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';

// Фиксированные типы тегов (клиентская часть)
export const TAG_TYPES = [
  { id: 1, name: 'Время' },
  { id: 2, name: 'Место' },
  { id: 3, name: 'Социум' },
] as const;

export const tagsApi = {
  getTagTypes: () => apiClient.get<TagType[]>('/Tags/types'),

  getTags: (
    tagTypeId?: number | null,
    searchTerm?: string | null,
    page: number = 0,
    pageSize: number = 20
  ) => {
    const params = new URLSearchParams();
    if (tagTypeId) params.append('tagTypeId', tagTypeId.toString());
    if (searchTerm) params.append('searchTerm', searchTerm);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    return apiClient.get<PagedResult<TagDetails>>(`/Tags?${params.toString()}`);
  },

  createTag: (data: { name: string; tagTypeId: number }) =>
    apiClient.post<number>('/Tags', data),

  deleteTag: (tagId: number) => apiClient.delete(`/Tags/${tagId}`),
};

// Hooks
export const useTagTypes = () => {
  return useQuery({
    queryKey: ['tagTypes'],
    queryFn: () => tagsApi.getTagTypes(),
    staleTime: Infinity, // Типы тегов неизменны
  });
};

export const useInfiniteTags = (
  tagTypeId?: number | null,
  searchTerm?: string | null,
  pageSize: number = 20
) => {
  return useInfiniteQuery({
    queryKey: ['tags', 'infinite', tagTypeId, searchTerm, pageSize],
    queryFn: ({ pageParam = 1 }) =>
      tagsApi.getTags(tagTypeId, searchTerm, pageParam, pageSize),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNext ? allPages.length + 1 : undefined,
    initialPageParam: 1,
  });
};

export const useTags = (
  tagTypeId?: number | null,
  searchTerm?: string | null,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: ['tags', tagTypeId, searchTerm, page, pageSize],
    queryFn: () => tagsApi.getTags(tagTypeId, searchTerm, page, pageSize),
    staleTime: 2 * 60 * 1000,
  });
};

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
