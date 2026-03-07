import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  CreateLanguageRequest,
  FtsConfigurationDto,
  LanguageDto,
  RoleDetails,
  UpdateLanguageRequest,
} from '../types/types';

export const referencesApi = {
  /**
   * Получает справочник ролей (авторы, редакторы и т.д.)
   */
  getRoles: (): Promise<RoleDetails[]> =>
    apiClient.get<RoleDetails[]>('/References/roles'),

  /**
   * Получает список всех языков
   */
  getLanguages: (): Promise<LanguageDto[]> =>
    apiClient.get<LanguageDto[]>('/References/languages'),

  /**
   * Получает язык по идентификатору
   */
  getLanguageById: (id: number): Promise<LanguageDto> =>
    apiClient.get<LanguageDto>(`/References/languages/${id}`),

  /**
   * Создает новую запись языка
   */
  createLanguage: (data: CreateLanguageRequest): Promise<number> =>
    apiClient.post<number, CreateLanguageRequest>(
      '/References/languages',
      data
    ),

  /**
   * Обновляет существующую запись языка
   */
  updateLanguage: (id: number, data: UpdateLanguageRequest): Promise<void> =>
    apiClient.put<void, UpdateLanguageRequest>(
      `/References/languages/${id}`,
      data
    ),

  /**
   * Удаляет запись языка
   */
  deleteLanguage: (id: number): Promise<void> =>
    apiClient.delete(`/References/languages/${id}`),

  getFtsConfigurations: (): Promise<FtsConfigurationDto[]> =>
    apiClient.get<FtsConfigurationDto[]>('/References/fts-configurations'),
};

// --- Hooks ---

export const useRoles = () => {
  return useQuery({
    queryKey: ['references', 'roles'],
    queryFn: referencesApi.getRoles,
    // Справочники обычно статичны, кэшируем на долгий срок (например, 24 часа)
    staleTime: 24 * 60 * 60 * 1000,
    // Данные не считаются устаревшими при потере фокуса окна
    refetchOnWindowFocus: false,
  });
};

/**
 * Хук для получения списка всех доступных FTS конфигураций
 */
export const useFtsConfigurations = () => {
  return useQuery({
    queryKey: ['references', 'fts-configurations'],
    queryFn: referencesApi.getFtsConfigurations,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Хук для получения списка всех языков
 */
export const useLanguages = () => {
  return useQuery({
    queryKey: ['references', 'languages'],
    queryFn: referencesApi.getLanguages,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Хук для получения языка по ID
 */
export const useLanguageById = (id: number | null) => {
  return useQuery({
    queryKey: ['references', 'languages', id],
    queryFn: () => {
      if (id === null) throw new Error('ID языка не указан');
      return referencesApi.getLanguageById(id);
    },
    enabled: id !== null,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

/**
 * Хук для создания языка
 */
export const useCreateLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referencesApi.createLanguage,
    onSuccess: () => {
      // Инвалидируем кэш языков после создания
      queryClient.invalidateQueries({ queryKey: ['references', 'languages'] });
    },
  });
};

/**
 * Хук для обновления языка
 */
export const useUpdateLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLanguageRequest }) =>
      referencesApi.updateLanguage(id, data),
    onSuccess: () => {
      // Инвалидируем кэш языков после обновления
      queryClient.invalidateQueries({ queryKey: ['references', 'languages'] });
    },
  });
};

/**
 * Хук для удаления языка
 */
export const useDeleteLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referencesApi.deleteLanguage,
    onSuccess: () => {
      // Инвалидируем кэш языков после удаления
      queryClient.invalidateQueries({ queryKey: ['references', 'languages'] });
    },
  });
};
