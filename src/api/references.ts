import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  CountryDto,
  CreateCountryRequest,
  CreateFormatRequest,
  CreateLanguageRequest,
  FormatDto,
  FtsConfigurationDto,
  LanguageDto,
  RoleDetails,
  UpdateCountryRequest,
  UpdateFormatRequest,
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

  /**
   * Получает список всех стран
   */
  getCountries: (): Promise<CountryDto[]> =>
    apiClient.get<CountryDto[]>('/References/countries'),

  /**
   * Получает страну по идентификатору
   */
  getCountryById: (id: number): Promise<CountryDto> =>
    apiClient.get<CountryDto>(`/References/countries/${id}`),

  /**
   * Создает новую запись страны
   */
  createCountry: (data: CreateCountryRequest): Promise<number> =>
    apiClient.post<number, CreateCountryRequest>('/References/countries', data),

  /**
   * Обновляет существующую запись страны
   */
  updateCountry: (id: number, data: UpdateCountryRequest): Promise<void> =>
    apiClient.put<void, UpdateCountryRequest>(
      `/References/countries/${id}`,
      data
    ),

  /**
   * Удаляет запись страны
   */
  deleteCountry: (id: number): Promise<void> =>
    apiClient.delete(`/References/countries/${id}`),

  /**
   * Получает список всех форматов книг
   */
  getFormats: (): Promise<FormatDto[]> =>
    apiClient.get<FormatDto[]>('/References/formats'),

  /**
   * Получает формат по идентификатору
   */
  getFormatById: (id: number): Promise<FormatDto> =>
    apiClient.get<FormatDto>(`/References/formats/${id}`),

  /**
   * Создает новую запись формата
   */
  createFormat: (data: CreateFormatRequest): Promise<number> =>
    apiClient.post<number, CreateFormatRequest>('/References/formats', data),

  /**
   * Обновляет существующую запись формата
   */
  updateFormat: (id: number, data: UpdateFormatRequest): Promise<void> =>
    apiClient.put<void, UpdateFormatRequest>(`/References/formats/${id}`, data),

  /**
   * Удаляет запись формата
   */
  deleteFormat: (id: number): Promise<void> =>
    apiClient.delete(`/References/formats/${id}`),
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

/**
 * Хук для получения списка всех стран
 */
export const useCountries = () => {
  return useQuery({
    queryKey: ['references', 'countries'],
    queryFn: referencesApi.getCountries,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Хук для получения страны по ID
 */
export const useCountryById = (id: number | null) => {
  return useQuery({
    queryKey: ['references', 'countries', id],
    queryFn: () => {
      if (id === null) throw new Error('ID страны не указан');
      return referencesApi.getCountryById(id);
    },
    enabled: id !== null,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

/**
 * Хук для создания страны
 */
export const useCreateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referencesApi.createCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'countries'] });
    },
  });
};

/**
 * Хук для обновления страны
 */
export const useUpdateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCountryRequest }) =>
      referencesApi.updateCountry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'countries'] });
    },
  });
};

/**
 * Хук для удаления страны
 */
export const useDeleteCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referencesApi.deleteCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'countries'] });
    },
  });
};

/**
 * Хук для получения списка всех форматов книг
 */
export const useFormats = () => {
  return useQuery({
    queryKey: ['references', 'formats'],
    queryFn: referencesApi.getFormats,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Хук для получения формата по ID
 */
export const useFormatById = (id: number | null) => {
  return useQuery({
    queryKey: ['references', 'formats', id],
    queryFn: () => {
      if (id === null) throw new Error('ID формата не указан');
      return referencesApi.getFormatById(id);
    },
    enabled: id !== null,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

/**
 * Хук для создания формата
 */
export const useCreateFormat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referencesApi.createFormat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'formats'] });
    },
  });
};

/**
 * Хук для обновления формата
 */
export const useUpdateFormat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFormatRequest }) =>
      referencesApi.updateFormat(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'formats'] });
    },
  });
};

/**
 * Хук для удаления формата
 */
export const useDeleteFormat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referencesApi.deleteFormat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'formats'] });
    },
  });
};
