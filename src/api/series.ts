// File: src/api/series.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  CreateSeriesRequest,
  SeriesDto,
  UpdateSeriesRequest,
} from '../types/types';
// import type { PublisherDto } from '@/types/types';

// --- API методы ---
export const seriesApi = {
  /**
   * Получает список всех серий книг
   */
  getSeries: (): Promise<SeriesDto[]> => apiClient.get<SeriesDto[]>('/Series'),

  /**
   * Получает серию по идентификатору
   */
  getSeriesById: (id: number): Promise<SeriesDto> =>
    apiClient.get<SeriesDto>(`/Series/${id}`),

  /**
   * Создает новую запись серии книг
   */
  createSeries: (data: CreateSeriesRequest): Promise<number> =>
    apiClient.post<number, CreateSeriesRequest>('/Series', data),

  /**
   * Обновляет существующую запись серии книг
   */
  updateSeries: (id: number, data: UpdateSeriesRequest): Promise<void> =>
    apiClient.put<void, UpdateSeriesRequest>(`/Series/${id}`, data),

  /**
   * Удаляет запись серии книг
   */
  deleteSeries: (id: number): Promise<void> =>
    apiClient.delete(`/Series/${id}`),
};

// --- Hooks ---

/**
 * Хук для получения списка всех серий книг
 */
export const useSeries = () => {
  return useQuery({
    queryKey: ['series'],
    queryFn: seriesApi.getSeries,
    staleTime: 5 * 60 * 1000, // 5 минут кэш
    refetchOnWindowFocus: false,
  });
};

/**
 * Хук для получения серии по ID
 */
export const useSeriesById = (id: number | null) => {
  return useQuery({
    queryKey: ['series', id],
    queryFn: () => {
      if (id === null) throw new Error('ID серии не указан');
      return seriesApi.getSeriesById(id);
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Хук для создания серии книг
 */
export const useCreateSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: seriesApi.createSeries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
    },
  });
};

/**
 * Хук для обновления серии книг
 */
export const useUpdateSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSeriesRequest }) =>
      seriesApi.updateSeries(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
    },
  });
};

/**
 * Хук для удаления серии книг
 */
export const useDeleteSeries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: seriesApi.deleteSeries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
    },
  });
};
