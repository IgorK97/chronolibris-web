// File: src/api/bookmarks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type { Bookmark, UserProfile } from '@/types/types';

export interface CreateBookmarkRequest {
  bookFileId: number;
  paraIndex: number;
  noteText?: string;
}

export interface UpdateBookmarkRequest {
  note?: string;
}

export const bookmarksApi = {
  /**
   * Получает список закладок для файла книги и пользователя
   */
  getBookmarks: (bookFileId: number): Promise<Bookmark[]> =>
    apiClient.get<Bookmark[]>(`/Bookmarks/${bookFileId}`),

  /**
   * Создаёт новую закладку
   */
  createBookmark: (data: CreateBookmarkRequest): Promise<Bookmark> =>
    apiClient.post<Bookmark>('/Bookmarks', data),

  /**
   * Обновляет заметку к закладке
   */
  updateBookmark: (id: number, data: UpdateBookmarkRequest): Promise<boolean> =>
    apiClient.put<boolean>(`/Bookmarks/${id}`, data),

  /**
   * Удаляет закладку
   */
  deleteBookmark: (id: number): Promise<boolean> =>
    apiClient.delete<boolean>(`/Bookmarks/${id}`),
};

export const useBookmarks = (
  bookFileId: number | null,
  userName: string | null
) => {
  return useQuery({
    queryKey: ['bookmarks', bookFileId, userName],
    queryFn: () => {
      if (bookFileId === null || userName === null) {
        throw new Error('bookFileId и userName обязательны');
      }
      return bookmarksApi.getBookmarks(bookFileId);
    },
    enabled: bookFileId !== null && userName !== null,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBookmark = (userName: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookmarksApi.createBookmark,
    onSuccess: (bookmarkDataFromServer, variables) => {
      // queryClient.invalidateQueries({
      //   queryKey: ['bookmarks', variables.bookFileId],
      // });
      const newBookmark: Bookmark = {
        bookFileId: variables.bookFileId,
        paraIndex: variables.paraIndex,
        note: variables.noteText,
        id: bookmarkDataFromServer.id,
        createdAt: bookmarkDataFromServer.createdAt,
      };
      console.log('Bookmark created:', newBookmark);
      queryClient.setQueryData<Bookmark[]>(
        ['bookmarks', variables.bookFileId, userName],
        (oldBookmarks) => {
          return oldBookmarks ? [...oldBookmarks, newBookmark] : [newBookmark];
        }
      );
    },
  });
};

export const useUpdateBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      bookFileId,
    }: {
      id: number;
      data: UpdateBookmarkRequest;
      bookFileId: number;
    }) => bookmarksApi.updateBookmark(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bookmarks', variables.bookFileId],
      });
    },
  });
};

export const useDeleteBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, bookFileId }: { id: number; bookFileId: number }) =>
      bookmarksApi.deleteBookmark(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bookmarks', variables.bookFileId],
      });
    },
  });
};
