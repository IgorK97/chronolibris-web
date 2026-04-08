import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  CreatePersonRequest,
  PersonDto,
  UpdatePersonRequest,
} from '@/types';

export const personsApi = {
  getPersons: (): Promise<PersonDto[]> =>
    apiClient.get<PersonDto[]>('/Persons'),

  getPersonById: (id: number): Promise<PersonDto> =>
    apiClient.get<PersonDto>(`/Persons/${id}`),

  createPerson: (data: CreatePersonRequest): Promise<number> =>
    apiClient.post<number, CreatePersonRequest>('/Persons', data),

  updatePerson: (id: number, data: UpdatePersonRequest): Promise<void> =>
    apiClient.put<void, UpdatePersonRequest>(`/Persons/${id}`, data),

  deletePerson: (id: number): Promise<void> =>
    apiClient.delete(`/Persons/${id}`),
};

export const usePersons = () => {
  return useQuery({
    queryKey: ['persons'],
    queryFn: personsApi.getPersons,
    staleTime: 5 * 60 * 1000, // 5 минут кэш
    refetchOnWindowFocus: false,
  });
};

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

export const useCreatePerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: personsApi.createPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });
};

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

export const useDeletePerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: personsApi.deletePerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });
};
