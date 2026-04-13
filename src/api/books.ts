import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  useMutation,
} from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  // BookContentLinkRequest,
  BookDetails,
  // BookDto,
  // BookFilterRequest,
  // BookFilters,
  // BookListItem,
  // BookListResponse,
  ContentDto,
  CreateBookRequest,
  TextSegment,
  TocData,
  // PagedResult,
  // SearchParams,
  UpdateBookRequest,
} from '../types';
// import { useDebounce } from '../hooks/useDebounce';
import { collectionsApi } from './collections';

export const booksApi = {
  // getBookById: (id: number): Promise<BookDto> =>
  //   apiClient.get<BookDto>(`/Books/${id}`),

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

export const useInfiniteShelfBooks = (
  userId: number,
  shelfId: number | undefined
) =>
  useInfiniteQuery({
    queryKey: ['books', 'shelf', shelfId, userId],
    queryFn: ({ pageParam }) =>
      collectionsApi.getShelfBooks(userId, shelfId!, pageParam, 10),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
    enabled: !!userId && !!shelfId,
  });

export const useInfiniteSelectionBooks = (
  userId: number,
  selectionId: number
) =>
  useInfiniteQuery({
    queryKey: ['books', 'selection', selectionId, userId],
    queryFn: ({ pageParam }) =>
      collectionsApi.getSelectionBooks(selectionId, pageParam ?? 0, 10),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined, //Нет ли здесь ошибки?
    enabled: !!userId && !!selectionId,
  });

export const useSelectionBooks = (selectionId: number) =>
  useQuery({
    queryKey: ['selection', selectionId],
    queryFn: () => collectionsApi.getSelectionBooks(selectionId, 0, 10),
    enabled: !!selectionId,
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
      if (bookId === null) throw new Error('ID книги не указан');
      return booksApi.getBookContents(bookId);
    },
    enabled: bookId !== null,
    staleTime: 2 * 60 * 1000,
  });
