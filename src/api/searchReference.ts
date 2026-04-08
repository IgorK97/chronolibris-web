import type {
  CountryDto,
  LanguageDto,
  PersonRoleDto,
  PersonSuggestionDto,
  TagSuggestionDto,
} from '@/types';
import { apiClient } from './apiClient';
import { useQuery } from '@tanstack/react-query';

export const searchReferenceApi = {
  getLanguages: () =>
    apiClient.get<LanguageDto[]>('/search/reference/languages'),

  getCountries: () =>
    apiClient.get<CountryDto[]>('/search/reference/countries'),

  getPersonRoles: () =>
    apiClient.get<PersonRoleDto[]>('/search/reference/person-roles'),

  searchPersons: (name: string, limit = 10) =>
    apiClient.get<PersonSuggestionDto[], { name: string; limit: number }>(
      '/search/reference/persons',
      { name, limit }
    ),

  searchTags: (name: string, limit = 10) =>
    apiClient.get<TagSuggestionDto[], { name: string; limit: number }>(
      '/search/reference/tags',
      { name, limit }
    ),
};

export const useLanguages = () =>
  useQuery({
    queryKey: ['search-reference', 'languages'],
    queryFn: searchReferenceApi.getLanguages,
    staleTime: Infinity,
  });

export const useCountries = () =>
  useQuery({
    queryKey: ['search-reference', 'countries'],
    queryFn: searchReferenceApi.getCountries,
    staleTime: Infinity,
  });

export const usePersonRoles = () =>
  useQuery({
    queryKey: ['search-reference', 'person-roles'],
    queryFn: searchReferenceApi.getPersonRoles,
    staleTime: Infinity,
  });

export const usePersonSuggestions = (name: string, enabled = true) =>
  useQuery({
    queryKey: ['search-reference', 'preson', name],
    queryFn: () => searchReferenceApi.searchPersons(name),
    enabled: enabled && name.trim().length >= 2,
    staleTime: 30_000,
  });
export const useTagSuggestions = (name: string, enabled = true) =>
  useQuery({
    queryKey: ['search-reference', 'tags', name],
    queryFn: () => searchReferenceApi.searchTags(name),
    enabled: enabled && name.trim().length >= 2,
    staleTime: 30_000,
  });
