import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type { RoleDetails } from '../types/types';

export const referencesApi = {
  /**
   * Получает справочник ролей (авторы, редакторы и т.д.)
   */
  getRoles: (): Promise<RoleDetails[]> =>
    apiClient.get<RoleDetails[]>('/References/roles'),
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
