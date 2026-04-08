import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  ReviewDetails,
  PagedResult,
  CreateReviewRequest,
  RateReviewCommand,
  UpdateReviewRequest,
  MyReviewDetails,
} from '../types';

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
      //все связанные данные
      qc.invalidateQueries({ queryKey: reviewKeys.all });
      //Обновляются данные самой книги (из-за рейтинга)
      qc.invalidateQueries({ queryKey: ['books', bookId] });
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
      qc.invalidateQueries({ queryKey: ['books', bookId] });
      qc.invalidateQueries({ queryKey: reviewKeys.lists(bookId) });
      qc.invalidateQueries({ queryKey: reviewKeys.my(bookId) });
    },
  });
};

export const useDeleteReview = (bookId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => reviewsApi.delete(reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books', bookId] });
      qc.invalidateQueries({ queryKey: reviewKeys.lists(bookId) });
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
