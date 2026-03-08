// File: src/api/themes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type { ThemeDto } from '../types/types';

// --- Типы запросов ---
export interface CreateThemeRequest {
  name: string;
  parentThemeId?: number | null;
}

export interface UpdateThemeRequest {
  id: number;
  name: string;
  parentThemeId?: number | null;
}

// --- API методы ---
export const themesApi = {
  /**
   * Получает список всех тем верхнего уровня
   */
  getThemes: (): Promise<ThemeDto[]> =>
    apiClient.get<ThemeDto[]>('/Themes'),

  /**
   * Получает список дочерних тем для указанной родительской темы
   */
  getThemesByParentId: (parentThemeId: number): Promise<ThemeDto[]> =>
    apiClient.get<ThemeDto[]>(`/Themes/parent/${parentThemeId}`),

  /**
   * Получает тему по идентификатору
   */
  getThemeById: (id: number): Promise<ThemeDto> =>
    apiClient.get<ThemeDto>(`/Themes/${id}`),

  /**
   * Создает новую запись темы
   */
  createTheme: (data: CreateThemeRequest): Promise<number> =>
    apiClient.post<number, CreateThemeRequest>('/Themes', data),

  /**
   * Обновляет существующую запись темы
   */
  updateTheme: (id: number, data: UpdateThemeRequest): Promise<void> =>
    apiClient.put<void, UpdateThemeRequest>(`/Themes/${id}`, data),

  /**
   * Удаляет запись темы
   */
  deleteTheme: (id: number): Promise<void> =>
    apiClient.delete(`/Themes/${id}`),
};

// --- Hooks ---

/**
 * Хук для получения списка всех тем верхнего уровня
 */
export const useThemes = () => {
  return useQuery({
    queryKey: ['themes'],
    queryFn: themesApi.getThemes,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Хук для получения списка дочерних тем для указанной родительской темы
 */
export const useThemesByParentId = (parentThemeId: number | null) => {
  return useQuery({
    queryKey: ['themes', 'parent', parentThemeId],
    queryFn: () => {
      if (parentThemeId === null) throw new Error('ID родительской темы не указан');
      return themesApi.getThemesByParentId(parentThemeId);
    },
    enabled: parentThemeId !== null,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Хук для получения темы по ID
 */
export const useThemeById = (id: number | null) => {
  return useQuery({
    queryKey: ['themes', id],
    queryFn: () => {
      if (id === null) throw new Error('ID темы не указан');
      return themesApi.getThemeById(id);
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Хук для создания темы
 */
export const useCreateTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: themesApi.createTheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });
};

/**
 * Хук для обновления темы
 */
export const useUpdateTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateThemeRequest }) =>
      themesApi.updateTheme(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });
};

/**
 * Хук для удаления темы
 */
export const useDeleteTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: themesApi.deleteTheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });
};

/**
 * Хук для получения всех тем (плоский список для селекта)
 */
export const useAllThemesFlat = () => {
  return useQuery({
    queryKey: ['themes', 'flat'],
    queryFn: themesApi.getThemes,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};