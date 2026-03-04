import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
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
  getByBookId: (bookId: number, lastId?: number, limit = 20) =>
    apiClient.get<PagedResult<ReviewDetails>>(
      `/Reviews/${bookId}?limit=${limit}&lastId=${lastId || ''}`
    ),

  create: (command: CreateReviewRequest) =>
    apiClient.post<number, CreateReviewRequest>('/Reviews', command),

  update: (reviewId: number, command: UpdateReviewRequest) =>
    apiClient.put<void, UpdateReviewRequest>(`/Reviews/${reviewId}`, command),

  delete: (reviewId: number) => apiClient.delete<void>(`/Reviews/${reviewId}`),

  rateReview: (command: RateReviewCommand) =>
    apiClient.post('/Reviews/rate', command),
};

export const useInfiniteReviews = (bookId: number, isAuth: boolean) => {
  return useInfiniteQuery({
    queryKey: ['reviews', bookId, isAuth],
    queryFn: ({ pageParam }) => reviewsApi.getByBookId(bookId, pageParam),
    enabled: !!bookId,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.lastId ?? undefined) : undefined,
  });
};

export const reviewKeys = {
  list: (bookId: number, isAuth: boolean) =>
    ['reviews', bookId, isAuth] as const,
};

export const useCreateReview = (bookId: number, isAuth: boolean) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateReviewRequest) => reviewsApi.create(req),
    onSuccess: () => {
      // Invalidate so the list refetches and includes the new (pending) review
      qc.invalidateQueries({ queryKey: reviewKeys.list(bookId, isAuth) });
    },
  });
};

export const useUpdateReview = (bookId: number, isAuth: boolean) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      ...req
    }: UpdateReviewRequest & { reviewId: number }) =>
      reviewsApi.update(reviewId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.list(bookId, isAuth) });
    },
  });
};

export const useDeleteReview = (bookId: number, isAuth: boolean) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => reviewsApi.delete(reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.list(bookId, isAuth) });
    },
  });
};
