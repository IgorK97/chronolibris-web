// File: src/api/publishers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  CreatePublisherRequest,
  PublisherDto,
  UpdatePublisherRequest,
} from '../types/types';
// import type { CountryDto } from '../types/types';

// --- API методы ---
export const publishersApi = {
  /**
   * Получает список всех издательств
   */
  getPublishers: (): Promise<PublisherDto[]> =>
    apiClient.get<PublisherDto[]>('/Publishers'),

  /**
   * Получает издательство по идентификатору
   */
  getPublisherById: (id: number): Promise<PublisherDto> =>
    apiClient.get<PublisherDto>(`/Publishers/${id}`),

  /**
   * Создает новую запись издательства
   */
  createPublisher: (data: CreatePublisherRequest): Promise<number> =>
    apiClient.post<number, CreatePublisherRequest>('/Publishers', data),

  /**
   * Обновляет существующую запись издательства
   */
  updatePublisher: (id: number, data: UpdatePublisherRequest): Promise<void> =>
    apiClient.put<void, UpdatePublisherRequest>(`/Publishers/${id}`, data),

  /**
   * Удаляет запись издательства
   */
  deletePublisher: (id: number): Promise<void> =>
    apiClient.delete(`/Publishers/${id}`),
};

// --- Hooks ---

/**
 * Хук для получения списка всех издательств
 */
export const usePublishers = () => {
  return useQuery({
    queryKey: ['publishers'],
    queryFn: publishersApi.getPublishers,
    staleTime: 5 * 60 * 1000, // 5 минут кэш для издательств
    refetchOnWindowFocus: false,
  });
};

/**
 * Хук для получения издательства по ID
 */
export const usePublisherById = (id: number | null) => {
  return useQuery({
    queryKey: ['publishers', id],
    queryFn: () => {
      if (id === null) throw new Error('ID издательства не указан');
      return publishersApi.getPublisherById(id);
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Хук для создания издательства
 */
export const useCreatePublisher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishersApi.createPublisher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
  });
};

/**
 * Хук для обновления издательства
 */
export const useUpdatePublisher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePublisherRequest }) =>
      publishersApi.updatePublisher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
  });
};

/**
 * Хук для удаления издательства
 */
export const useDeletePublisher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishersApi.deletePublisher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishers'] });
    },
  });
};
