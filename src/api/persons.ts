// File: src/api/persons.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type { PersonDto } from '@/types/types';

// --- Типы запросов ---
export interface CreatePersonRequest {
  name: string;
  description: string;
  imageBase64?: string;
  fileName?: string;
}

export interface UpdatePersonRequest {
  id: number;
  name: string;
  description: string;
  imageBase64?: string;
  fileName?: string;
}

// --- API методы ---
export const personsApi = {
  /**
   * Получает список всех персон
   */
  getPersons: (): Promise<PersonDto[]> =>
    apiClient.get<PersonDto[]>('/Persons'),

  /**
   * Получает персону по идентификатору
   */
  getPersonById: (id: number): Promise<PersonDto> =>
    apiClient.get<PersonDto>(`/Persons/${id}`),

  /**
   * Создает новую запись персоны с изображением
   */
  createPerson: (data: CreatePersonRequest): Promise<number> =>
    apiClient.post<number, CreatePersonRequest>('/Persons', data),

  /**
   * Обновляет существующую запись персоны с изображением
   */
  updatePerson: (id: number, data: UpdatePersonRequest): Promise<void> =>
    apiClient.put<void, UpdatePersonRequest>(`/Persons/${id}`, data),

  /**
   * Удаляет запись персоны
   */
  deletePerson: (id: number): Promise<void> =>
    apiClient.delete(`/Persons/${id}`),
};

// --- Hooks ---

/**
 * Хук для получения списка всех персон
 */
export const usePersons = () => {
  return useQuery({
    queryKey: ['persons'],
    queryFn: personsApi.getPersons,
    staleTime: 5 * 60 * 1000, // 5 минут кэш
    refetchOnWindowFocus: false,
  });
};

/**
 * Хук для получения персоны по ID
 */
export const usePersonById = (id: number | null) => {
  return useQuery({
    queryKey: ['persons', id],
    queryFn: () => {
      if (id === null) throw new Error('ID персоны не указан');
      return personsApi.getPersonById(id);
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Хук для создания персоны
 */
export const useCreatePerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: personsApi.createPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });
};

/**
 * Хук для обновления персоны
 */
export const useUpdatePerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePersonRequest }) =>
      personsApi.updatePerson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });
};

/**
 * Хук для удаления персоны
 */
export const useDeletePerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: personsApi.deletePerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });
};
