import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  ContentDto,
  // ContentListResponse,
  ContentFilterRequest,
  TagDetails,
  CreateContentRequest,
  // PatchContentRequest,
  BookContentLinkRequest,
  PagedResult,
  UpdateContentRequest,
} from '../types';
import type { BookDto } from '../types';

export const contentsApi = {
  getContents: (
    filter: ContentFilterRequest
  ): Promise<PagedResult<ContentDto>> =>
    apiClient.get<PagedResult<ContentDto>>('/Contents', filter),

  getContentById: (id: number): Promise<ContentDto> =>
    apiClient.get<ContentDto>(`/Contents/${id}`),

  getContentBooks: (contentId: number): Promise<BookDto[]> =>
    apiClient.get<BookDto[]>(`/Contents/${contentId}/books`),

  getContentTags: (contentId: number): Promise<TagDetails[]> =>
    apiClient.get<TagDetails[]>(`/Contents/${contentId}/tags`),

  addTagToContent: (contentId: number, tagId: number): Promise<void> =>
    apiClient.post<void>(`/Contents/${contentId}/tags/${tagId}`),

  removeTagFromContent: (contentId: number, tagId: number): Promise<void> =>
    apiClient.delete(`/Contents/${contentId}/tags/${tagId}`),

  createContent: (data: CreateContentRequest): Promise<number> =>
    apiClient.post<number, CreateContentRequest>('/Contents', data),

  updateContent: (data: UpdateContentRequest): Promise<void> =>
    apiClient.put<void, UpdateContentRequest>(`/Contents/${data.id}`, data),

  deleteContent: (id: number): Promise<void> =>
    apiClient.delete(`/Contents/${id}`),

  linkBookToContent: (
    contentId: number,
    bookId: number,
    data: BookContentLinkRequest
  ): Promise<void> =>
    apiClient.post<void, BookContentLinkRequest>(
      `/Contents/${contentId}/books/${bookId}`,
      data
    ),

  unlinkBookFromContent: (contentId: number, bookId: number): Promise<void> =>
    apiClient.delete(`/Contents/${contentId}/books/${bookId}`),
};

export const useInfiniteContents = (
  filter: ContentFilterRequest,
  enabled: boolean
) => {
  return useInfiniteQuery({
    queryKey: ['contents', 'infinite', filter],

    queryFn: ({ pageParam }) =>
      contentsApi.getContents({
        ...filter,
        lastId: pageParam,
      }),
    initialPageParam: null as number | null,

    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled: enabled && !!filter,
  });
};

export const useContentById = (id: number | null) => {
  return useQuery({
    queryKey: ['contents', id],
    queryFn: () => {
      return contentsApi.getContentById(id!);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useContentBooks = (contentId: number | null) => {
  return useQuery({
    queryKey: ['contents', contentId, 'books'],
    queryFn: () => {
      return contentsApi.getContentBooks(contentId!);
    },
    enabled: !!contentId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contentsApi.createContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
};

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contentsApi.updateContent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contents', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
};

export const useDeleteContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contentsApi.deleteContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
};

export const useLinkBookToContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contentId,
      bookId,
      data,
    }: {
      contentId: number;
      bookId: number;
      data: BookContentLinkRequest;
    }) => contentsApi.linkBookToContent(contentId, bookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
};

export const useUnlinkBookFromContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contentId,
      bookId,
    }: {
      contentId: number;
      bookId: number;
    }) => contentsApi.unlinkBookFromContent(contentId, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
  });
};

export const useContentTags = (contentId: number | null) => {
  return useQuery({
    queryKey: ['contentTags', contentId],
    queryFn: () => {
      return contentsApi.getContentTags(contentId!);
    },
    enabled: !!contentId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useAddTagToContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, tagId }: { contentId: number; tagId: number }) =>
      contentsApi.addTagToContent(contentId, tagId),
    onSuccess: (_, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: ['contentTags', contentId] });
      queryClient.invalidateQueries({ queryKey: ['contents', contentId] });
    },
  });
};

export const useRemoveTagFromContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, tagId }: { contentId: number; tagId: number }) =>
      contentsApi.removeTagFromContent(contentId, tagId),
    onSuccess: (_, { contentId }) => {
      queryClient.invalidateQueries({ queryKey: ['contentTags', contentId] });
      queryClient.invalidateQueries({ queryKey: ['contents', contentId] });
    },
  });
};
