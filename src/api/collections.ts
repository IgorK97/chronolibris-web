import { apiClient } from './apiClient';
import type {
  SelectionDetails,
  ShelfDetails,
  BookListItem,
  PagedResult,
} from '../types';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { queryClient } from './queryClient';

export const collectionsApi = {
  getAllSelections: () => apiClient.get<SelectionDetails[]>('/Selections'),

  getSelections: (
    lastId?: number | null,
    limit: number = 20,
    onlyActive?: boolean
  ) => {
    const params = new URLSearchParams();
    if (lastId) params.set('lastId', String(lastId));
    params.set('limit', String(limit));
    if (onlyActive !== undefined) params.set('onlyActive', String(onlyActive));
    return apiClient.get<PagedResult<SelectionDetails>>(
      `/selections/paged?${params.toString()}`
    );
  },

  getSelection: (selectionId: number) =>
    apiClient.get<SelectionDetails>(`/Selections/${selectionId}`),

  getSelectionBooks: (
    selectionId: number,
    // userId: number,
    lastId: number | null,
    limit: number = 10
  ) =>
    apiClient.get<PagedResult<BookListItem>>(
      `/Selections/${selectionId}/books?lastId=${lastId || ''}&limit=${limit}`
    ),

  createSelection: (data: { name: string; description: string }) =>
    apiClient.post<number>(`/Selections`, data),

  updateSelection: (
    selectionId: number,
    data: { name?: string; description?: string; isActive?: boolean }
  ) => apiClient.put(`/Selections/${selectionId}`, data),

  deleteSelection: (selectionId: number) =>
    apiClient.delete(`/Selections/${selectionId}`),

  addBookToSelection: (selectionId: number, bookId: number) =>
    apiClient.post(`/Selections/${selectionId}/books/${bookId}`),

  removeBookFromSelection: (selectionId: number, bookId: number) =>
    apiClient.delete(`/Selections/${selectionId}/books/${bookId}`),

  getUserShelves: () => apiClient.get<ShelfDetails[]>(`/Shelves/user`),

  addBookToShelf: (shelfId: number, bookId: number) =>
    apiClient.post<boolean>(`/Shelves/${shelfId}/books/${bookId}`),

  getShelfBooks: (
    userId: number,
    shelfId: number,
    lastId: number | null,
    limit: number = 10
  ) =>
    apiClient.get<PagedResult<BookListItem>>(
      `/Shelves/${shelfId}/books?userId=${userId}&lastId=${lastId || ''}&limit=${limit}`
    ),

  removeBookFromShelf: (shelfId: number, bookId: number) =>
    apiClient.delete<boolean>(`/Shelves/${shelfId}/books/${bookId}`),

  createShelf: (name: string) => apiClient.post<number>(`/Shelves`, { name }),

  updateShelf: (shelfId: number, name: string) =>
    apiClient.put<boolean>(`/Shelves/${shelfId}`, { name }),
  deleteShelf: (shelfId: number) =>
    apiClient.delete<boolean>(`/Shelves/${shelfId}`),

  seekBookInShelf: (bookId: number) =>
    apiClient.get<number[]>(`/Shelves/books/${bookId}`),
};

export const useCreateShelf = () => {
  // const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => collectionsApi.createShelf(name),
    onSuccess: () => {
      // Автоматически обновляем список полок для текущего пользователя
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });
};

export const useUpdateShelf = () => {
  // const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      collectionsApi.updateShelf(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });
};

export const useDeleteShelf = () => {
  // const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => collectionsApi.deleteShelf(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    },
  });
};

export const useSeekedShelves = (bookId: number) => {
  return useQuery({
    queryKey: ['seekedShelves', bookId],
    queryFn: () => collectionsApi.seekBookInShelf(bookId),
    enabled: !!bookId,
  });
};

export const useShelves = (userId: number) => {
  return useQuery({
    queryKey: ['shelves', userId],
    queryFn: () => collectionsApi.getUserShelves(),
    enabled: !!userId,
  });
};

export const useSelectionsInfinite = (
  limit: number = 20,
  onlyActive: boolean = true
) => {
  return useInfiniteQuery({
    queryKey: ['selections', 'infinite', limit, onlyActive],
    queryFn: ({ pageParam }) =>
      collectionsApi.getSelections(
        pageParam as number | null,
        limit,
        onlyActive
      ),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSelections = (
  lastId?: number | null,
  limit: number = 20,
  onlyActive: boolean = true
) => {
  return useQuery({
    queryKey: ['selections', 'paged', lastId, limit, onlyActive],
    queryFn: () => collectionsApi.getSelections(lastId, limit, onlyActive),
    staleTime: 5 * 60 * 1000,
  });
};

// export const useSelectionBooks = (
//   selectionId: number,
//   lastId: number | null,
//   limit: number = 10
// ) => {
//   return useQuery({
//     queryKey: ['selectionBooks', selectionId, lastId, limit],
//     queryFn: () =>
//       collectionsApi.getSelectionBooks(selectionId, lastId ?? 0, limit),
//     enabled: !!selectionId,
//   });
// };

export const useSelectionBooks = (
  selectionId: number,
  lastId: number | null,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ['selectionBooks', selectionId, lastId, limit],
    queryFn: () => collectionsApi.getSelectionBooks(selectionId, lastId, limit),
    enabled: !!selectionId,
    //На всякий случай, пока идет рефетч после инвалидации, вернуть старые данные вместо undefined
    placeholderData: keepPreviousData,
  });
};

export const useAllSelections = () => {
  return useQuery({
    queryKey: ['selections'],
    queryFn: () => collectionsApi.getAllSelections(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSelection = (selectionId: number) => {
  return useQuery({
    queryKey: ['selection', selectionId],
    queryFn: () => collectionsApi.getSelection(selectionId),
    enabled: !!selectionId,
  });
};

export const useCreateSelection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectionsApi.createSelection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selections'] });
    },
  });
};

export const useUpdateSelection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      selectionId,
      data,
    }: {
      selectionId: number;
      data: { name?: string; description?: string; isActive?: boolean };
    }) => collectionsApi.updateSelection(selectionId, data),
    onSuccess: (_, { selectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['selection', selectionId] });
      queryClient.invalidateQueries({ queryKey: ['selections'] });
    },
  });
};

export const useDeleteSelection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectionsApi.deleteSelection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selections'] });
    },
  });
};

export const useAddBookToSelection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      selectionId,
      bookId,
    }: {
      selectionId: number;
      bookId: number;
    }) => collectionsApi.addBookToSelection(selectionId, bookId),
    onSuccess: (_, { selectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['selectionBooks', selectionId],
      });
    },
  });
};

export const useRemoveBookFromSelection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      selectionId,
      bookId,
    }: {
      selectionId: number;
      bookId: number;
    }) => collectionsApi.removeBookFromSelection(selectionId, bookId),
    onSuccess: (_, { selectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['selectionBooks', selectionId],
      });
    },
  });
};
