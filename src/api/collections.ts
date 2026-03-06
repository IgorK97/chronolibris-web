import { apiClient } from './apiClient';
import type {
  SelectionDetails,
  ShelfDetails,
  BookListItem,
  PagedResult,
} from '../types/types';
import { useQuery } from '@tanstack/react-query';

export const collectionsApi = {
  // Selections
  getSelections: () => apiClient.get<SelectionDetails[]>('/Selections'),

  getSelectionBooks: (
    selectionId: number,
    // userId: number,
    lastId: number,
    limit: number = 10
  ) =>
    apiClient.get<PagedResult<BookListItem>>(
      `/Selections/${selectionId}/books?lastId=${lastId || ''}&limit=${limit}`
    ),

  // Shelves
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
  // -------------------

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

export const useSeekedShelves = (bookId: number) => {
  return useQuery({
    queryKey: ['seekedShelves', bookId],
    queryFn: () => collectionsApi.seekBookInShelf(bookId),
    enabled: !!bookId,
  });
};

// hooks/useShelves.ts
export const useShelves = (userId: number) => {
  return useQuery({
    queryKey: ['shelves', userId],
    queryFn: () => collectionsApi.getUserShelves(),
    enabled: !!userId,
  });
};

export const useSelection = () => {
  return useQuery({
    queryKey: ['selections'],
    queryFn: () => collectionsApi.getSelections(),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};
