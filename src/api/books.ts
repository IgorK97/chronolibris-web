import {
  useQuery,
  useInfiniteQuery,
  type UseQueryOptions,
  useQueryClient,
  useMutation,
  // useMutation
} from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  BookDetails,
  BookDto,
  BookFilterRequest,
  BookFilters,
  BookListItem,
  BookListResponse,
  ContentDto,
  CreateBookRequest,
  PagedResult,
  UpdateBookRequest,
  UpdateReadingProgressCommand,
} from '../types/types';
import { useDebounce } from '../hooks/useDebounce';
import { collectionsApi } from './collections';
interface SearchParams {
  query: string;
  userId: number;
  lastId?: number;
  limit: number;
  genreIds?: number[];
  languages?: string[];
  rating?: number | null;
  yearFrom?: string;
  yearTo?: string;
}

export interface BookContentLinkRequest {
  bookId: number;
  contentId: number;
  order: number;
}
export const booksApi = {
  getMetadata: (bookId: number, userId: number) =>
    apiClient.get<BookDetails>(`/Books/${bookId}/info?userId=${userId}`),

  getReadBooks: (params: { userId: number; lastId?: number; limit: number }) =>
    apiClient.get<PagedResult<BookListItem>>(
      `/Books/readbooks?userId=${params.userId}&lastId=${params.lastId || ''}&limit=${params.limit}`
    ),

  // search: (params: {
  //   query: string;
  //   userId: number;
  //   lastId?: number;
  //   limit: number;
  // }) =>
  //   apiClient.get<PagedResult<BookListItem>>(
  //     `/Books/search?query=${params.query}&userId=${params.userId}&lastId=${params.lastId || ""}&limit=${params.limit}`,
  //   ),

  search: (params: SearchParams) => {
    // Axios превратит { genreIds: [1, 2] } в ?genreIds=1&genreIds=2 автоматически
    return apiClient.get<PagedResult<BookListItem>>('/Books/search', params);
  },

  updateProgress: (command: UpdateReadingProgressCommand) =>
    apiClient.post(`/Books/${command.bookId}/progress`, command),

  getBooks: (filter: BookFilterRequest): Promise<BookListResponse> =>
    apiClient.get<BookListResponse>('/Books', filter),

  getBookById: (id: number): Promise<BookDto> =>
    apiClient.get<BookDto>(`/Books/${id}`),

  getBookContents: (bookId: number): Promise<ContentDto[]> =>
    apiClient.get<ContentDto[]>(`/Books/${bookId}/contents`),

  createBook: (data: CreateBookRequest): Promise<number> =>
    apiClient.post<number, CreateBookRequest>('/Books', data),

  updateBook: (id: number, data: UpdateBookRequest): Promise<void> =>
    apiClient.put<void, UpdateBookRequest>(`/Books/${id}`, data),

  deleteBook: (id: number): Promise<void> => apiClient.delete(`/Books/${id}`),

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
};

type UseBookDetailsOptions = Omit<
  UseQueryOptions<BookDetails, Error>,
  'queryKey' | 'queryFn'
>;

export const useBookDetails = (
  bookId: number,
  userId: number,
  options?: UseBookDetailsOptions
) => {
  return useQuery({
    queryKey: ['books', bookId, userId],
    queryFn: () => booksApi.getMetadata(bookId, userId),
    ...options,
  });
};

// Бесконечный список прочитанных книг
export const useInfiniteReadBooks = (userId: number) => {
  return useInfiniteQuery({
    queryKey: ['books', 'read', userId],
    queryFn: ({ pageParam }) =>
      booksApi.getReadBooks({ userId, lastId: pageParam, limit: 10 }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.items.length > 0
        ? lastPage.items[lastPage.items.length - 1].id
        : undefined,
  });
};

// export const useInfiniteReadBooks = (userId: number) => {
//   return useInfiniteQuery({
//     queryKey: ["books", "read", userId],
//     queryFn: ({ pageParam }) => booksApi.getReadBooks({ userId, lastId: pageParam ?? 0, limit: 10 }),
//     initialPageParam: null as number | null,
//     getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.lastId : undefined,
//     enabled: !!userId,
//   });
// };

export const useInfiniteShelfBooks = (
  userId: number,
  shelfId: number | undefined
) => {
  return useInfiniteQuery({
    queryKey: ['books', 'shelf', shelfId, userId],
    queryFn: ({ pageParam }) =>
      collectionsApi.getShelfBooks(userId, shelfId!, pageParam, 10),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
    enabled: !!userId && !!shelfId,
  });
};

// Добавьте это в файл, где лежат ваши хуки React Query
export const useInfiniteSelectionBooks = (
  userId: number,
  selectionId: number
) => {
  return useInfiniteQuery({
    queryKey: ['books', 'selection', selectionId, userId],
    queryFn: ({ pageParam }) =>
      collectionsApi.getSelectionBooks(
        // userId,
        selectionId,
        pageParam ?? 0, // lastId
        10 // limit
      ),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
    enabled: !!userId && !!selectionId,
  });
};

export const useSelectionBooks = (selectionId: number) => {
  return useQuery({
    queryKey: ['selection', selectionId],
    queryFn: () => collectionsApi.getSelectionBooks(selectionId, 0, 10),
    enabled: !!selectionId,
  });
};

export const useInfiniteSearch = (
  userId: number,
  params: { query: string; filters: BookFilters }
) => {
  return useInfiniteQuery({
    // Ключ зависит от параметров, которые реально применил пользователь
    queryKey: ['books', 'search', userId, params.query, params.filters],
    queryFn: ({ pageParam }) =>
      booksApi.search({
        query: params.query,
        userId,
        lastId: pageParam,
        limit: 10,
        // ...params.filters,
        genreIds: params.filters.genreIds,
        languages: params.filters.languages,
        rating: params.filters.rating,
        yearFrom: params.filters.yearFrom,
        yearTo: params.filters.yearTo,
      }),
    // ВАЖНО: Выключаем авто-запуск (если строка запроса пуста)
    enabled: params.query.length > 2 || params.filters.genreIds.length > 0, // Начинаем поиск только от 3-х символов
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
  });
};
// Использование
// 2. В компоненте
// const handleApply = () => {
//   // Просто обновляем стейт. React Query сам увидит это и начнет поиск.
//   setAppliedParams({
//     query: searchInput,
//     filters: tempFilters
//   });
//   setOpen(false); // Закрываем модалку
// };

// Теперь обновляем хук
export const useInfiniteSearchDebounced = (
  query: string,
  userId: number,
  filters: BookFilters // Никаких any!
) => {
  const debouncedQuery = useDebounce(query, 1000); // Используем наш дебаунс

  return useInfiniteQuery({
    // Теперь запрос сработает только когда debouncedQuery изменится
    queryKey: ['books', 'search', debouncedQuery, userId, filters],
    queryFn: ({ pageParam }) =>
      booksApi.search({
        query: debouncedQuery,
        userId,
        lastId: pageParam,
        limit: 10,
        ...filters,
      }),
    enabled: debouncedQuery.length > 2, // Начинаем поиск только от 3-х символов
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
  });
};

export const useBooks = (filter: BookFilterRequest) => {
  return useQuery({
    queryKey: ['books', filter],
    queryFn: () => booksApi.getBooks(filter),
    staleTime: 2 * 60 * 1000,
  });
};

export const useBookById = (id: number | null) => {
  return useQuery({
    queryKey: ['books', id],
    queryFn: () => {
      if (id === null) throw new Error('ID книги не указан');
      return booksApi.getBookById(id);
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: booksApi.createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBookRequest }) =>
      booksApi.updateBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
};

export const useDeleteBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: booksApi.deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
};

export const useBookContents = (bookId: number | null) => {
  return useQuery({
    queryKey: ['books', bookId, 'contents'],
    queryFn: () => {
      if (bookId === null) throw new Error('ID книги не указан');
      return booksApi.getBookContents(bookId);
    },
    enabled: bookId !== null,
    staleTime: 2 * 60 * 1000,
  });
};

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
};
