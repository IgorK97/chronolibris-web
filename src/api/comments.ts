import { apiClient } from './apiClient';
import type { CommentDto, CreateCommentRequest } from '../types/types';

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

  create: (req: CreateCommentRequest) =>
    apiClient.post<number>('/Comments', req),

  delete: (id: number) => apiClient.delete<void>(`/Comments/${id}`),
};
