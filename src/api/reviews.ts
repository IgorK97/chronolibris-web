import {
  useInfiniteQuery,
  // useMutation,
  // useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  ReviewDetails,
  PagedResult,
  CreateReviewRequest,
  RateReviewCommand,
  UpdateReviewRequest,
} from '../types/types';

export const reviewsApi = {
  getByBookId: (
    bookId: number,
    userId: number | null,
    lastId?: number,
    limit = 20
  ) =>
    apiClient.get<PagedResult<ReviewDetails>>(
      `/Reviews/${bookId}?limit=${limit}&userId=${userId || ''}&lastId=${lastId || ''}`
    ),

  create: (command: CreateReviewRequest) =>
    apiClient.post<number, CreateReviewRequest>('/Reviews', command),

  update: (reviewId: number, command: UpdateReviewRequest) =>
    apiClient.put<void, UpdateReviewRequest>(`/Reviews/${reviewId}`, command),

  delete: (reviewId: number) => apiClient.delete<void>(`/Reviews/${reviewId}`),

  rateReview: (command: RateReviewCommand) =>
    apiClient.post('/Reviews/rate', command),
};

export const useInfiniteReviews = (bookId: number, userId: number | null) => {
  return useInfiniteQuery({
    queryKey: ['reviews', bookId, userId],
    queryFn: ({ pageParam }) =>
      reviewsApi.getByBookId(bookId, userId, pageParam),
    enabled: !!bookId && !!userId,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.items.length > 0
        ? lastPage.items[lastPage.items.length - 1].id
        : undefined,
  });
};
