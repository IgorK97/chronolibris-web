import { apiClient } from './apiClient';
import type { TagType, TagDetails, PagedResult } from '../types';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';

export const tagsApi = {
  getTagTypes: () => apiClient.get<TagType[]>('/Tags/types'),

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

export const useTagTypes = () =>
  useQuery({
    queryKey: ['tagTypes'],
    queryFn: () => tagsApi.getTagTypes(),
    staleTime: Infinity,
  });

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
