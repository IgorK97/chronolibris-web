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
  getUserShelves: (userId: number) =>
    apiClient.get<ShelfDetails[]>(`/Shelves/user/${userId}`),

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
};

// hooks/useShelves.ts
export const useShelves = (userId: number) => {
  return useQuery({
    queryKey: ['shelves', userId],
    queryFn: () => collectionsApi.getUserShelves(userId),
    enabled: !!userId,
  });
};
