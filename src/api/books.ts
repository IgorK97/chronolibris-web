import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  BookDetails,
  ContentDto,
  CreateBookRequest,
  TextSegment,
  TocData,
  UpdateBookRequest,
} from '../types';
import { queryClient } from './queryClient';

export const booksApi = {
  createBook: (data: CreateBookRequest): Promise<number> =>
    apiClient.post<number, CreateBookRequest>('/Books', data),

  updateBook: (id: number, data: UpdateBookRequest): Promise<void> =>
    apiClient.put<void, UpdateBookRequest>(`/Books/${id}`, data),

  getMetadata: (bookId: number, administration: boolean) =>
    apiClient.get<BookDetails>(`/Books/${bookId}/info?mode=${administration}`),

  getBookContents: (bookId: number): Promise<ContentDto[]> =>
    apiClient.get<ContentDto[]>(`/Books/${bookId}/contents`),

  fetchToc: (bookFileId: number): Promise<TocData> =>
    apiClient.get<TocData>(`/Books/files/${bookFileId}/toc`),

  fetchChunk: (
    bookFileId: number,
    chunkIndex: string
  ): Promise<TextSegment[]> =>
    apiClient.get<TextSegment[]>(
      `/books/files/${bookFileId}/chunks/${chunkIndex}`
    ),
};

export const prefetchBookChunk = (
  bookFileId: number,
  nextIdx: number,
  fetchedTocData: TocData | undefined
) => {
  queryClient.prefetchQuery({
    queryKey: ['chunk', bookFileId, nextIdx],
    queryFn: () => {
      const url = fetchedTocData?.Parts[nextIdx]?.url;
      if (!url) {
        throw new Error('URL нет для следующей части');
      }
      return booksApi.fetchChunk(bookFileId, fetchedTocData.Parts[nextIdx].url);
    },
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });
};

export const useBookToc = (bookFileId: number) => {
  return useQuery({
    queryKey: ['toc', bookFileId],
    queryFn: () => {
      return booksApi.fetchToc(bookFileId);
    },
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    networkMode: 'always',
  });
};

export const useBookChunk = (
  bookFileId: number,
  currentPartIndex: number,
  fetchedTocData: TocData | undefined
) => {
  // console.log('useBookChunk', { bookFileId, currentPartIndex, fetchedTocData });
  return useQuery({
    queryKey: ['chunk', bookFileId, currentPartIndex],
    queryFn: () => {
      const url = fetchedTocData?.Parts[currentPartIndex]?.url;
      if (!url) {
        throw new Error('URL нет для текущей части');
      }
      return booksApi.fetchChunk(bookFileId, url);
    },
    enabled: !!fetchedTocData && currentPartIndex < fetchedTocData.Parts.length,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    networkMode: 'always',
  });
};

export const useBookDetails = (
  bookId: number,
  userName: string,
  administration: boolean = false,
  enabled: boolean
) =>
  useQuery({
    queryKey: ['books', bookId, userName],
    queryFn: () => booksApi.getMetadata(bookId, administration),
    enabled: enabled,
  });

export const useCreateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: booksApi.createBook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBookRequest }) =>
      booksApi.updateBook(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });
};

export const useBookContents = (bookId: number | null) =>
  useQuery({
    queryKey: ['books', bookId, 'contents'],
    queryFn: () => {
      return booksApi.getBookContents(bookId!);
    },
    enabled: !!bookId,
    staleTime: 2 * 60 * 1000,
  });
