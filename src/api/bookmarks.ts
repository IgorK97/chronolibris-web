import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  Bookmark,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
} from '@/types';

export const bookmarksApi = {
  getBookmarks: (bookFileId: number): Promise<Bookmark[]> =>
    apiClient.get<Bookmark[]>(`/Bookmarks/${bookFileId}`),

  createBookmark: (data: CreateBookmarkRequest): Promise<Bookmark> =>
    apiClient.post<Bookmark>('/Bookmarks', data), //По факту возвращает id и createdAt, потом перепишу

  updateBookmark: (id: number, data: UpdateBookmarkRequest): Promise<void> =>
    apiClient.put<void>(`/Bookmarks/${id}`, data),

  deleteBookmark: (id: number): Promise<void> =>
    apiClient.delete<void>(`/Bookmarks/${id}`),
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
      // console.log('Bookmark created:', newBookmark);
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: ({ id, bookFileId }: { id: number; bookFileId: number }) =>
      bookmarksApi.deleteBookmark(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bookmarks', variables.bookFileId],
      });
    },
  });
};
