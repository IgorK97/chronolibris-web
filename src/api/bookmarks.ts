import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  Bookmark,
  BookmarkWithBookDetails,
  CreateBookmarkRequest,
  PagedResult,
  UpdateBookmarkRequest,
} from '@/types';

export const bookmarksApi = {
  getBookmarks: (bookFileId: number): Promise<Bookmark[]> =>
    apiClient.get<Bookmark[]>(`/Bookmarks/${bookFileId}`),

  createBookmark: (data: CreateBookmarkRequest): Promise<Bookmark> =>
    apiClient.post<Bookmark>('/Bookmarks', data), //id и createdAt

  updateBookmark: (id: number, data: UpdateBookmarkRequest): Promise<void> =>
    apiClient.put<void>(`/Bookmarks/${id}`, data),

  deleteBookmark: (id: number): Promise<void> =>
    apiClient.delete<void>(`/Bookmarks/${id}`),

  getMyBookmarksPaged: (
    number: number,
    pageSize: number,
    search?: string
  ): Promise<PagedResult<BookmarkWithBookDetails>> => {
    return apiClient.get<PagedResult<BookmarkWithBookDetails>>(
      `/Bookmarks/my`,
      {
        number,
        pageSize,
        search,
      }
    );
  },
};

export const useMyBookmarksPaged = (pageSize: number, search: string) => {
  return useInfiniteQuery({
    queryKey: ['my-bookmarks', pageSize, search],
    queryFn: ({ pageParam }) =>
      bookmarksApi.getMyBookmarksPaged(pageParam, pageSize, search),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.lastId : undefined;
    },
  });
};

export const useBookmarks = (
  bookFileId: number | null,
  userName: string | null
) => {
  return useQuery({
    queryKey: ['bookmarks', bookFileId, userName],
    queryFn: () => {
      return bookmarksApi.getBookmarks(bookFileId!);
    },
    enabled: !!bookFileId && !!userName,
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
        context: variables.context,
        xpointer: variables.xpointer,
        note: variables.noteText,
        id: bookmarkDataFromServer.id,
        createdAt: bookmarkDataFromServer.createdAt,
      };
      queryClient.setQueryData<Bookmark[]>(
        ['bookmarks', variables.bookFileId, userName],
        (oldBookmarks) => {
          return oldBookmarks ? [...oldBookmarks, newBookmark] : [newBookmark];
        }
      );
      queryClient.invalidateQueries({ queryKey: ['my-bookmarks'] });
    },
  });
};

export const useUpdateBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
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
    mutationFn: ({ id }: { id: number; bookFileId: number }) =>
      bookmarksApi.deleteBookmark(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bookmarks', variables.bookFileId],
      });
    },
  });
};
