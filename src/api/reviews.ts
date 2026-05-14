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
  getByBookId: (bookId: number, lastId: number | null, limit: number = 20) =>
    apiClient.get<PagedResult<ReviewDetails>>(`/Reviews/${bookId}`, {
      limit,
      lastId: lastId ?? undefined,
    }),

  getMyReview: (bookId: number) =>
    apiClient.get<MyReviewDetails>(`/Reviews/my/${bookId}`),

  create: (command: CreateReviewRequest) =>
    apiClient.post<number, CreateReviewRequest>('/Reviews', command),

  update: (command: UpdateReviewRequest) =>
    apiClient.put<void, UpdateReviewRequest>(
      `/Reviews/${command.reviewId}`,
      command
    ),

  delete: (reviewId: number) => apiClient.delete<void>(`/Reviews/${reviewId}`),

  rateReview: (command: RateReviewCommand) =>
    apiClient.post('/Reviews/rate', command),
};

export const useRateReview = () => {
  return useMutation({
    mutationFn: (command: RateReviewCommand) => reviewsApi.rateReview(command),
    // onSuccess: () => {
    //   // queryClient.invalidateQueries({ queryKey: ['books', bookId] });
    //   // queryClient.invalidateQueries({ queryKey: reviewKeys.lists(bookId) });
    //   // queryClient.invalidateQueries({ queryKey: reviewKeys.my(bookId) });
    // },
  });
};

export const useInfiniteReviews = (bookId: number, isAuth: boolean) => {
  return useInfiniteQuery({
    queryKey: ['reviews', bookId, isAuth],
    queryFn: ({ pageParam }) => reviewsApi.getByBookId(bookId, pageParam),
    enabled: !!bookId,
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.lastId ?? undefined) : undefined,
  });
};

export const useCreateReview = () => {
  return useMutation({
    mutationFn: (req: CreateReviewRequest) => reviewsApi.create(req),
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', bookId] });
      //обновление данных самой книги (из-за рейтинга)
      queryClient.invalidateQueries({ queryKey: ['books', bookId] });
    },
  });
};

export const useUpdateReview = (bookId: number) => {
  return useMutation({
    mutationFn: (reviewData: UpdateReviewRequest) =>
      reviewsApi.update(reviewData),
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
    retry: false, //если отзыва нет, то повторять не нужно (пока не инвалидирован кэш)
  });
};
