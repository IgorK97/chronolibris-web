import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  ContentDto,
  ContentListResponse,
  ContentFilterRequest,
  TagDetails,
  CreateContentRequest,
  PatchContentRequest,
  BookContentLinkRequest,
} from '../types';
import type { BookDto } from '../types';

export const contentsApi = {
  getContents: (filter: ContentFilterRequest): Promise<ContentListResponse> =>
    apiClient.get<ContentListResponse>('/Contents', filter),

  getContentById: (id: number): Promise<ContentDto> =>
    apiClient.get<ContentDto>(`/Contents/${id}`),

  getContentBooks: (contentId: number): Promise<BookDto[]> =>
    apiClient.get<BookDto[]>(`/Contents/${contentId}/books`),

  createContent: (data: CreateContentRequest): Promise<number> =>
    apiClient.post<number, CreateContentRequest>('/Contents', data),

  deleteContent: (id: number): Promise<void> =>
    apiClient.delete(`/Contents/${id}`),

  patchContent: (data: PatchContentRequest): Promise<void> =>
    apiClient.put<void, PatchContentRequest>(`/Contents/${data.id}`, data),

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

  getContentTags: (contentId: number): Promise<TagDetails[]> =>
    apiClient.get<TagDetails[]>(`/Contents/${contentId}/tags`),

  searchTags: (
    searchTerm: string,
    tagTypeId?: number | null,
    limit: number = 5
  ): Promise<TagDetails[]> => {
    const params = new URLSearchParams();
    params.append('searchTerm', searchTerm);
    if (tagTypeId) params.append('tagTypeId', tagTypeId.toString());
    params.append('limit', limit.toString());
    return apiClient.get<TagDetails[]>(
      `/Contents/tags/search?${params.toString()}`
    );
  },

  addTagToContent: (contentId: number, tagId: number): Promise<void> =>
    apiClient.post<void>(`/Contents/${contentId}/tags/${tagId}`),

  removeTagFromContent: (contentId: number, tagId: number): Promise<void> =>
    apiClient.delete(`/Contents/${contentId}/tags/${tagId}`),
};

export const useContents = (filter: ContentFilterRequest) => {
  return useQuery({
    queryKey: ['contents', filter],
    queryFn: () => contentsApi.getContents(filter),
    staleTime: 2 * 60 * 1000,
  });
};

interface UseOptions {
  enabled?: boolean;
}

export const useInfiniteContents = (
  filter: ContentFilterRequest,
  options?: UseOptions
) => {
  const enabled = options?.enabled !== undefined ? options.enabled : !!filter;
  return useInfiniteQuery({
    queryKey: ['contents', 'infinite', filter],

    //pageParam будет распознан как string | undefined
    queryFn: ({ pageParam }) =>
      contentsApi.getContents({
        ...filter,
        cursor: pageParam,
      }),

    //тип для начального значения параметра страницы
    initialPageParam: undefined as string | undefined,

    //возврат undefined, если следующей страницы нет
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,

    staleTime: 2 * 60 * 1000,
    enabled: enabled && !!filter,
  });
};

export const useContentById = (id: number | null) => {
  return useQuery({
    queryKey: ['contents', id],
    queryFn: () => {
      if (id === null) throw new Error('ID контента не указан');
      return contentsApi.getContentById(id);
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  });
};

export const useContentBooks = (contentId: number | null) => {
  return useQuery({
    queryKey: ['contents', contentId, 'books'],
    queryFn: () => {
      if (contentId === null) throw new Error('ID контента не указан');
      return contentsApi.getContentBooks(contentId);
    },
    enabled: contentId !== null,
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

export const usePatchContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contentsApi.patchContent,
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
      if (contentId === null) throw new Error('ID контента не указан');
      return contentsApi.getContentTags(contentId);
    },
    enabled: contentId !== null,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSearchTags = (
  searchTerm: string,
  tagTypeId?: number | null
) => {
  return useQuery({
    queryKey: ['searchTags', searchTerm, tagTypeId],
    queryFn: () => contentsApi.searchTags(searchTerm, tagTypeId, 5),
    enabled: searchTerm.length >= 2,
    staleTime: 1 * 60 * 1000,
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
