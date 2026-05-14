import { apiClient } from './apiClient';
import type { CommentDto, CreateCommentRequest } from '../types';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { queryClient } from './queryClient';

export const commentsApi = {
  getByBookId: (bookId: number, lastId: number | null, limit = 20) =>
    apiClient.get<CommentDto[]>(`/Comments/book/${bookId}`, {
      limit,
      lastId: lastId ?? undefined,
    }),

  getReplies: (parentId: number, lastId: number | null, limit = 50) =>
    apiClient.get<CommentDto[]>(`/Comments/${parentId}/replies`, {
      limit,
      lastId: lastId ?? undefined,
    }),

  create: (req: CreateCommentRequest) =>
    apiClient.post<number>('/Comments', req),

  delete: (id: number) => apiClient.delete<void>(`/Comments/${id}`),

  rateComment: (command: { commentId: number; score: number }) =>
    apiClient.post('/Comments/rate', command),
};

export const useDeleteComment = () => {
  return useMutation({
    mutationFn: ({
      id,
    }: {
      id: number;
      bookId: number;
      parentCommentId: number | null;
    }) => commentsApi.delete(id),
    onSuccess: (_, { bookId, parentCommentId }) => {
      if (parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ['comments', 'replies', parentCommentId],
        });
        queryClient.invalidateQueries({
          queryKey: ['comments', bookId],
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments', bookId] });
      }
    },
  });
};

export const useGetCommentsByBook = (bookId: number) => {
  return useInfiniteQuery({
    queryKey: ['comments', bookId],
    queryFn: ({ pageParam }) => commentsApi.getByBookId(bookId, pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.length > 0 ? lastPage[lastPage.length - 1].id : undefined,
  });
};

export const useGetRepliesByComment = (parentId: number, showMore: boolean) => {
  return useInfiniteQuery({
    queryKey: ['comments', 'replies', parentId],
    queryFn: ({ pageParam }) => commentsApi.getReplies(parentId, pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.length > 0 ? lastPage[lastPage.length - 1].id : undefined,
    enabled: showMore,
    staleTime: 0,
  });
};

export const useCreateComment = () => {
  return useMutation({
    mutationFn: (req: CreateCommentRequest) => commentsApi.create(req),
    onSuccess: (_, { parentCommentId, bookId }) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', bookId],
      });
      if (parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ['comments', 'replies', parentCommentId],
        });
      }
    },
  });
};

export const useRateComment = (bookId: number, parentId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (command: { commentId: number; score: number }) =>
      commentsApi.rateComment(command),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', bookId] });
      if (parentId) {
        qc.invalidateQueries({ queryKey: ['comments', 'replies', parentId] });
      }
    },
  });
};
