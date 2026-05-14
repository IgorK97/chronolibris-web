import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type {
  CountryDto,
  CreateCountryRequest,
  // CreateFormatRequest,
  CreateLanguageRequest,
  FormatDto,
  LanguageDto,
  RoleDetails,
  UpdateCountryRequest,
  // UpdateFormatRequest,
  UpdateLanguageRequest,
} from '../types';

export const referencesApi = {
  getRoles: (): Promise<RoleDetails[]> =>
    apiClient.get<RoleDetails[]>('/References/roles'),

  getLanguages: (): Promise<LanguageDto[]> =>
    apiClient.get<LanguageDto[]>('/References/languages'),

  getLanguageById: (id: number): Promise<LanguageDto> =>
    apiClient.get<LanguageDto>(`/References/languages/${id}`),

  createLanguage: (data: CreateLanguageRequest): Promise<number> =>
    apiClient.post<number, CreateLanguageRequest>(
      '/References/languages',
      data
    ),

  updateLanguage: (id: number, data: UpdateLanguageRequest): Promise<void> =>
    apiClient.put<void, UpdateLanguageRequest>(
      `/References/languages/${id}`,
      data
    ),

  deleteLanguage: (id: number): Promise<void> =>
    apiClient.delete(`/References/languages/${id}`),

  getCountries: (): Promise<CountryDto[]> =>
    apiClient.get<CountryDto[]>('/References/countries'),

  getCountryById: (id: number): Promise<CountryDto> =>
    apiClient.get<CountryDto>(`/References/countries/${id}`),

  createCountry: (data: CreateCountryRequest): Promise<number> =>
    apiClient.post<number, CreateCountryRequest>('/References/countries', data),

  updateCountry: (id: number, data: UpdateCountryRequest): Promise<void> =>
    apiClient.put<void, UpdateCountryRequest>(
      `/References/countries/${id}`,
      data
    ),

  deleteCountry: (id: number): Promise<void> =>
    apiClient.delete(`/References/countries/${id}`),

  getFormats: (): Promise<FormatDto[]> =>
    apiClient.get<FormatDto[]>('/References/formats'),
};

export const useRoles = () => {
  return useQuery({
    queryKey: ['references', 'roles'],
    queryFn: referencesApi.getRoles,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useLanguages = () => {
  return useQuery({
    queryKey: ['references', 'languages'],
    queryFn: referencesApi.getLanguages,
    // staleTime: 24 * 60 * 60 * 1000,
    // refetchOnWindowFocus: false,
  });
};

export const useLanguageById = (id: number | null) => {
  return useQuery({
    queryKey: ['references', 'languages', id],
    queryFn: () => {
      return referencesApi.getLanguageById(id!);
    },
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useCreateLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referencesApi.createLanguage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'languages'] });
    },
  });
};

export const useUpdateLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLanguageRequest }) =>
      referencesApi.updateLanguage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'languages'] });
    },
  });
};

export const useDeleteLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referencesApi.deleteLanguage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'languages'] });
    },
  });
};

export const useCountries = () => {
  return useQuery({
    queryKey: ['references', 'countries'],
    queryFn: referencesApi.getCountries,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCountryById = (id: number | null) => {
  return useQuery({
    queryKey: ['references', 'countries', id],
    queryFn: () => {
      return referencesApi.getCountryById(id!);
    },
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useCreateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referencesApi.createCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'countries'] });
    },
  });
};

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

export const useDeleteCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: referencesApi.deleteCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references', 'countries'] });
    },
  });
};

export const useFormats = () => {
  return useQuery({
    queryKey: ['references', 'formats'],
    queryFn: referencesApi.getFormats,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
