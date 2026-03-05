import { apiClient } from './apiClient';
import type { CommentDto, CreateCommentRequest } from '../types/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const commentsApi = {
  // Получение корневых комментариев
  getByBookId: (bookId: number, lastId?: number, limit = 20) =>
    apiClient.get<CommentDto[]>(
      `/Comments/book/${bookId}?limit=${limit}&lastId=${lastId || ''}`
    ),

  // Получение ответов на комментарий
  getReplies: (parentId: number, lastId?: number, limit = 50) =>
    apiClient.get<CommentDto[]>(
      `/Comments/${parentId}/replies?limit=${limit}&lastId=${lastId || ''}`
    ),

  rateComment: (command: { commentId: number; score: number }) =>
    apiClient.post('/Comments/rate', command),

  create: (req: CreateCommentRequest) =>
    apiClient.post<number>('/Comments', req),

  delete: (id: number) => apiClient.delete<void>(`/Comments/${id}`),
};
export const useRateComment = (bookId: number, parentId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (command: { commentId: number; score: number }) =>
      commentsApi.rateComment(command),
    onSuccess: () => {
      // Инвалидируем основной список комментариев
      qc.invalidateQueries({ queryKey: ['comments', bookId] });
      // Если это ответ, инвалидируем ветку ответов
      if (parentId) {
        qc.invalidateQueries({ queryKey: ['comments', 'replies', parentId] });
      }
    },
  });
};
