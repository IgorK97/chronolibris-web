import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  CreateThemeRequest,
  ThemeDto,
  UpdateThemeRequest,
} from '../types';

export const themesApi = {
  getThemes: (): Promise<ThemeDto[]> =>
    apiClient.get<ThemeDto[]>('/Themes/all'),

  getThemesByName: (name: string): Promise<ThemeDto[]> =>
    apiClient.get<ThemeDto[]>(`/Themes/?q=${name}`),

  getThemesByParentId: (parentThemeId: number): Promise<ThemeDto[]> =>
    apiClient.get<ThemeDto[]>(`/Themes/parent/${parentThemeId}`),

  getThemeById: (id: number): Promise<ThemeDto> =>
    apiClient.get<ThemeDto>(`/Themes/${id}`),

  createTheme: (data: CreateThemeRequest): Promise<number> =>
    apiClient.post<number, CreateThemeRequest>('/Themes', data),

  updateTheme: (id: number, data: UpdateThemeRequest): Promise<void> =>
    apiClient.put<void, UpdateThemeRequest>(`/Themes/${id}`, data),

  //Почему воид можно не указывать?
  deleteTheme: (id: number): Promise<void> => apiClient.delete(`/Themes/${id}`),
};

export const useThemes = () => {
  return useQuery({
    queryKey: ['themes'],
    queryFn: themesApi.getThemes,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useThemesByParentId = (parentThemeId: number | null) => {
  return useQuery({
    queryKey: ['themes', 'parent', parentThemeId],
    queryFn: () => {
      if (parentThemeId === null)
        throw new Error('ID родительской темы не указан');
      return themesApi.getThemesByParentId(parentThemeId);
    },
    enabled: parentThemeId !== null,
    staleTime: 5 * 60 * 1000,
  });
};

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

export const useCreateTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: themesApi.createTheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });
};

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

export const useDeleteTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: themesApi.deleteTheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });
};

export const useAllThemesFlat = (name: string) => {
  return useQuery({
    queryKey: ['themes', 'flat'],
    queryFn: () => themesApi.getThemesByName(name),
    // staleTime: 5 * 60 * 1000,
    // refetchOnWindowFocus: false,
    enabled: name.trim().length > 0,
  });
};
