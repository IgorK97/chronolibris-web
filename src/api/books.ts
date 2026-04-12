import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  useMutation,
} from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  BookContentLinkRequest,
  BookDetails,
  BookDto,
  BookFilterRequest,
  // BookFilters,
  // BookListItem,
  BookListResponse,
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
  getBooks: (filter: BookFilterRequest): Promise<BookListResponse> =>
    apiClient.get<BookListResponse>('/Books', filter),

  getBookById: (id: number): Promise<BookDto> =>
    apiClient.get<BookDto>(`/Books/${id}`),

  createBook: (data: CreateBookRequest): Promise<number> =>
    apiClient.post<number, CreateBookRequest>('/Books', data),

  updateBook: (id: number, data: UpdateBookRequest): Promise<void> =>
    apiClient.put<void, UpdateBookRequest>(`/Books/${id}`, data),

  deleteBook: (id: number): Promise<void> => apiClient.delete(`/Books/${id}`),

  getMetadata: (bookId: number, administration: boolean) =>
    apiClient.get<BookDetails>(`/Books/${bookId}/info?mode=${administration}`),

  getBookContents: (bookId: number): Promise<ContentDto[]> =>
    apiClient.get<ContentDto[]>(`/Books/${bookId}/contents`),

  linkContentToBook: (
    bookId: number,
    contentId: number,
    data: BookContentLinkRequest
  ): Promise<void> =>
    apiClient.post<void, BookContentLinkRequest>(
      `/Books/${bookId}/contents/${contentId}`,
      data
    ),

  unlinkContentFromBook: (bookId: number, contentId: number): Promise<void> =>
    apiClient.delete(`/Books/${bookId}/contents/${contentId}`),

  fetchToc: (bookFileId: number): Promise<TocData> =>
    apiClient.get<TocData>(`/api/books/files/${bookFileId}/toc`),

  fetchChunk: (
    bookFileId: number,
    chunkIndex: string
  ): Promise<TextSegment[]> =>
    apiClient.get<TextSegment[]>(
      `/api/books/files/${bookFileId}/chunks/${chunkIndex}`
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
      lastPage.hasNext ? lastPage.lastId : undefined,
    enabled: !!userId && !!selectionId,
  });

export const useSelectionBooks = (selectionId: number) =>
  useQuery({
    queryKey: ['selection', selectionId],
    queryFn: () => collectionsApi.getSelectionBooks(selectionId, 0, 10),
    enabled: !!selectionId,
  });

// export const useInfiniteSearch = (
//   userId: number,
//   params: { query: string; filters: BookFilters }
// ) =>
//   useInfiniteQuery({
//     queryKey: ['books', 'search', userId, params.query, params.filters],
//     queryFn: ({ pageParam }) =>
//       booksApi.search({
//         query: params.query,
//         userId,
//         lastId: pageParam,
//         limit: 10,
//         genreIds: params.filters.genreIds,
//         languages: params.filters.languages,
//         rating: params.filters.rating,
//         yearFrom: params.filters.yearFrom,
//         yearTo: params.filters.yearTo,
//       }),
//     enabled: params.query.length > 2 || params.filters.genreIds.length > 0,
//     initialPageParam: undefined as number | undefined,
//     getNextPageParam: (lastPage) =>
//       lastPage.hasNext ? lastPage.lastId : undefined,
//   });

// export const useInfiniteSearchDebounced = (
//   query: string,
//   userId: number,
//   filters: BookFilters
// ) => {
//   const debouncedQuery = useDebounce(query, 1000);

//   return useInfiniteQuery({
//     queryKey: ['books', 'search', debouncedQuery, userId, filters],
//     queryFn: ({ pageParam }) =>
//       booksApi.search({
//         query: debouncedQuery,
//         userId,
//         lastId: pageParam,
//         limit: 10,
//         ...filters,
//       }),
//     enabled: debouncedQuery.length > 2,
//     initialPageParam: undefined as number | undefined,
//     getNextPageParam: (lastPage) =>
//       lastPage.hasNext ? lastPage.lastId : undefined,
//   });
// };

export const useBooks = (filter: BookFilterRequest) =>
  useQuery({
    queryKey: ['books', filter],
    queryFn: () => booksApi.getBooks(filter),
    staleTime: 2 * 60 * 1000,
  });

export const useBookById = (id: number | null) =>
  useQuery({
    queryKey: ['books', id],
    queryFn: () => {
      if (id === null) throw new Error('ID книги не указан');
      return booksApi.getBookById(id);
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
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

export const useDeleteBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: booksApi.deleteBook,
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

export const useLinkContentToBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookId,
      contentId,
      data,
    }: {
      bookId: number;
      contentId: number;
      data: BookContentLinkRequest;
    }) => booksApi.linkContentToBook(bookId, contentId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });
};

export const useUnlinkContentFromBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookId,
      contentId,
    }: {
      bookId: number;
      contentId: number;
    }) => booksApi.unlinkContentFromBook(bookId, contentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });
};
