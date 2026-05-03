import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  ReviewDetails,
  PagedResult,
  CreateReviewRequest,
  RateReviewCommand,
  UpdateReviewRequest,
  MyReviewDetails,
} from '../types';
import { queryClient } from './queryClient';

export const reviewsApi = {
  getByBookId: (bookId: number, lastId?: number, limit = 20) =>
    apiClient.get<PagedResult<ReviewDetails>>(
      `/Reviews/${bookId}?limit=${limit}&lastId=${lastId || ''}`
    ),

  getMyReview: (bookId: number) =>
    apiClient.get<MyReviewDetails>(`/Reviews/my/${bookId}`),

  create: (command: CreateReviewRequest) =>
    apiClient.post<number, CreateReviewRequest>('/Reviews', command),

  update: (reviewId: number, command: UpdateReviewRequest) =>
    apiClient.put<void, UpdateReviewRequest>(`/Reviews/${reviewId}`, command),

  delete: (reviewId: number) => apiClient.delete<void>(`/Reviews/${reviewId}`),

  rateReview: (command: RateReviewCommand) =>
    apiClient.post('/Reviews/rate', command), //потом надо бы исправить (нет получения типа), но это несущественно
};

export const useRateReview = () => {
  return useMutation({
    mutationFn: (command: RateReviewCommand) => reviewsApi.rateReview(command),
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ['books', bookId] });
      // queryClient.invalidateQueries({ queryKey: reviewKeys.lists(bookId) });
      // queryClient.invalidateQueries({ queryKey: reviewKeys.my(bookId) });
    },
  });
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

export const useCreateReview = () => {
  return useMutation({
    mutationFn: (req: CreateReviewRequest) => reviewsApi.create(req),
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', bookId] });
      //Обновляются данные самой книги (из-за рейтинга)
      queryClient.invalidateQueries({ queryKey: ['books', bookId] });
    },
  });
};

export const useUpdateReview = (bookId: number) => {
  return useMutation({
    mutationFn: ({
      reviewId,
      ...req
    }: UpdateReviewRequest & { reviewId: number }) =>
      reviewsApi.update(reviewId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', bookId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', bookId] });
      // queryClient.invalidateQueries({ queryKey: ['reviews', 'my'] });
    },
  });
};

export const useDeleteReview = (bookId: number) => {
  return useMutation({
    mutationFn: (reviewId: number) => reviewsApi.delete(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books', bookId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', bookId] });
      // queryClient.invalidateQueries({ queryKey: reviewKeys.my(bookId) });
    },
  });
};

export const useMyReview = (bookId: number, isAuth: boolean) => {
  return useQuery({
    queryKey: ['reviews', bookId, 'my'],
    queryFn: () => reviewsApi.getMyReview(bookId),
    enabled: isAuth && !!bookId,
    retry: false, // Если отзыва нет, то не надо повторять запросы вообще (пока не инвалидирован кэш)
  });
};
