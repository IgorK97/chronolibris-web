import {
  useInfiniteQuery,
  useMutation,
  useQuery,
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
  MyReviewDetails,
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

  getMyReview: (bookId: number) =>
    apiClient.get<MyReviewDetails>(`/Reviews/my/${bookId}`),
};

export const useInfiniteReviews = (bookId: number, isAuth: boolean) => {
  return useInfiniteQuery({
    queryKey: [...reviewKeys.lists(bookId), 'reviews', bookId, isAuth],
    queryFn: ({ pageParam }) => reviewsApi.getByBookId(bookId, pageParam),
    enabled: !!bookId,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.lastId ?? undefined) : undefined,
  });
};

// export const reviewKeys = {
//   all: ['reviews'] as const,
//   list: (bookId: number, isAuth: boolean) =>
//     ['reviews', bookId, isAuth] as const,
//   my: (bookId: number) => [...reviewKeys.all, 'my', bookId] as const,
// };

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: (bookId: number) => [...reviewKeys.all, 'list', bookId] as const,
  my: (bookId: number) => [...reviewKeys.all, 'my', bookId] as const,
};

export const useCreateReview = (bookId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateReviewRequest) => reviewsApi.create(req),
    onSuccess: () => {
      // Сбрасываем все связанные данные
      qc.invalidateQueries({ queryKey: reviewKeys.all });
      // Также полезно обновить данные самой книги (рейтинг)
      qc.invalidateQueries({ queryKey: ['books', bookId] });
      // Invalidate so the list refetches and includes the new (pending) review
      // qc.invalidateQueries({ queryKey: reviewKeys.list(bookId, isAuth) });
    },
  });
};

export const useUpdateReview = (bookId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      ...req
    }: UpdateReviewRequest & { reviewId: number }) =>
      reviewsApi.update(reviewId, req),
    onSuccess: () => {
      // qc.invalidateQueries({ queryKey: reviewKeys.list(bookId, isAuth) });
      qc.invalidateQueries({ queryKey: ['books', bookId] });
      // 1. Помечаем список отзывов как устаревший (чтобы он перекачался)
      qc.invalidateQueries({ queryKey: reviewKeys.lists(bookId) });

      // 2. Помечаем конкретно "мой" отзыв как устаревший
      qc.invalidateQueries({ queryKey: reviewKeys.my(bookId) });
    },
  });
};

export const useDeleteReview = (bookId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => reviewsApi.delete(reviewId),
    onSuccess: () => {
      // qc.invalidateQueries({ queryKey: reviewKeys.list(bookId, isAuth) });
      qc.invalidateQueries({ queryKey: ['books', bookId] });
      // 1. Помечаем список отзывов как устаревший (чтобы он перекачался)
      qc.invalidateQueries({ queryKey: reviewKeys.lists(bookId) });

      // 2. Помечаем конкретно "мой" отзыв как устаревший
      qc.invalidateQueries({ queryKey: reviewKeys.my(bookId) });
    },
  });
};

export const useMyReview = (bookId: number, isAuth: boolean) => {
  return useQuery({
    queryKey: ['reviews', 'my', bookId],
    queryFn: () => reviewsApi.getMyReview(bookId),
    enabled: isAuth && !!bookId,
    retry: false, // Если 404 (отзыва нет), не нужно пытаться снова
  });
};
