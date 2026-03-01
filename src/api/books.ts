import {
  useQuery,
  useInfiniteQuery,
  type UseQueryOptions,
  // useMutation
} from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  BookDetails,
  BookFilters,
  BookListItem,
  PagedResult,
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
};

// --- Hooks ---

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
