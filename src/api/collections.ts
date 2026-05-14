import { apiClient } from './apiClient';
import type {
  SelectionDetails,
  ShelfDetails,
  BookListItem,
  PagedResult,
} from '../types';
import {
  // keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { queryClient } from './queryClient';
// import { queryClient } from './queryClient';

export const collectionsApi = {
  getAllSelections: () => apiClient.get<SelectionDetails[]>('/Selections'),
  seekBookInSelection: (bookId: number) =>
    apiClient.get<number[]>(`/Selections/books/${bookId}`),
  getSelections: (
    lastId: number | null,
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
      `/Selections/${selectionId}/books?${lastId ? `lastId=${lastId}` : ''}&limit=${limit}`
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
    apiClient.post<void>(`/Shelves/${shelfId}/books/${bookId}`),

  getShelfBooks: (shelfId: number, lastId: number | null, limit: number = 10) =>
    apiClient.get<PagedResult<BookListItem>>(
      `/Shelves/${shelfId}/books?${lastId ? `lastId=${lastId}` : ''}&limit=${limit}`
    ),

  removeBookFromShelf: (shelfId: number, bookId: number) =>
    apiClient.delete(`/Shelves/${shelfId}/books/${bookId}`),

  createShelf: (name: string) => apiClient.post<number>(`/Shelves`, { name }),

  updateShelf: (shelfId: number, name: string) =>
    apiClient.put(`/Shelves/${shelfId}`, { name }),
  deleteShelf: (shelfId: number) => apiClient.delete(`/Shelves/${shelfId}`),

  seekBookInShelf: (bookId: number) =>
    apiClient.get<number[]>(`/Shelves/books/${bookId}`),
};

export const useShelves = (userLogin: string, reader: boolean) => {
  return useQuery({
    queryKey: ['shelves', userLogin],
    queryFn: () => collectionsApi.getUserShelves(),
    enabled: !!userLogin && reader,
  });
};

export const useCreateShelf = () => {
  return useMutation({
    mutationFn: (name: string) => collectionsApi.createShelf(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['books', 'shelves'] });
    },
  });
};

export const useUpdateShelf = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      collectionsApi.updateShelf(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['books', 'shelves'] });
    },
  });
};

export const useDeleteShelf = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => collectionsApi.deleteShelf(id),
    onSuccess: () => {
      //_, id
      // queryClient.removeQueries({ queryKey: ['books', 'shelves', id] });
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
      queryClient.invalidateQueries({ queryKey: ['books', 'shelves'] });
    },
  });
};

export const useInfiniteShelfBooks = (
  userLogin: string,
  shelfId: number | undefined
) =>
  useInfiniteQuery({
    queryKey: ['books', 'shelves', shelfId],
    queryFn: ({ pageParam }) =>
      collectionsApi.getShelfBooks(shelfId!, pageParam, 10),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
    enabled: !!userLogin && !!shelfId,
  });

export const useSeekedShelves = (bookId: number, userLogin: string) => {
  return useQuery({
    queryKey: ['books', 'shelves', bookId],
    queryFn: () => collectionsApi.seekBookInShelf(bookId),
    enabled: !!userLogin && !!bookId,
  });
};

export const useAddBookToShelf = () => {
  return useMutation({
    mutationFn: ({ shelfId, bookId }: { shelfId: number; bookId: number }) =>
      collectionsApi.addBookToShelf(shelfId, bookId),
    onSuccess: (_, { bookId, shelfId }) => {
      queryClient.invalidateQueries({ queryKey: ['books', 'shelves', bookId] });
      queryClient.invalidateQueries({ queryKey: ['books', bookId] });
      queryClient.invalidateQueries({
        queryKey: ['books', 'shelves', shelfId],
      });
      queryClient.invalidateQueries({ queryKey: ['selections'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
};

export const useRemoveBookFromShelf = () => {
  return useMutation({
    mutationFn: ({ shelfId, bookId }: { shelfId: number; bookId: number }) =>
      collectionsApi.removeBookFromShelf(shelfId, bookId),
    onSuccess: (_, { shelfId, bookId }) => {
      queryClient.invalidateQueries({
        queryKey: ['books', 'shelves', shelfId],
      });
      queryClient.invalidateQueries({ queryKey: ['books', bookId] });

      queryClient.invalidateQueries({
        queryKey: ['books', 'shelves', bookId],
      });
      queryClient.invalidateQueries({ queryKey: ['selections'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
};

export const useSelectionsInfinite = (
  limit: number = 20,
  onlyActive: boolean = true
) => {
  return useInfiniteQuery({
    queryKey: ['selections', 'infinite', limit, onlyActive],
    queryFn: ({ pageParam }) =>
      collectionsApi.getSelections(pageParam, limit, onlyActive),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: 'always',
  });
};

export const useSeekedSelections = (bookId: number) => {
  return useQuery({
    queryKey: ['selections', 'book', bookId],
    queryFn: () => collectionsApi.seekBookInSelection(bookId),
    enabled: !!bookId,
  });
};

export const useInfiniteSelectionBooks = (
  selectionId: number,
  limit: number = 10
) =>
  useInfiniteQuery({
    queryKey: ['selection', 'infinite', selectionId],
    queryFn: ({ pageParam }) =>
      collectionsApi.getSelectionBooks(
        selectionId,
        pageParam as number | null,
        limit
      ),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastId : undefined,
    enabled: !!selectionId,
  });

export const useSelectionBooksDefault = (selectionId: number) =>
  useQuery({
    queryKey: ['selections', selectionId],
    queryFn: () => collectionsApi.getSelectionBooks(selectionId, 0, 10),
    enabled: !!selectionId,
  });

export const useAllSelections = () => {
  return useQuery({
    queryKey: ['selections'],
    queryFn: () => collectionsApi.getAllSelections(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: 'always',
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
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ['selection'] });
      queryClient.invalidateQueries({ queryKey: ['selections'] });
      queryClient.invalidateQueries({
        queryKey: ['selections', 'book', bookId],
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
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ['selection'] });
      queryClient.invalidateQueries({ queryKey: ['selections'] });
      queryClient.invalidateQueries({
        queryKey: ['selections', 'book', bookId],
      });
    },
  });
};
