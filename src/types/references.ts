export interface PersonRoleFilter {
  roleId: number;
  personIds: number[];
}

export interface FormatDto {
  id: number;
  name: string;
}

export const BookFileStatuses = {
  PENDING: 1,
  UPLOADED: 2,
  PROCESSING: 3,
  COMPLETED: 4,
  FAILED: 5,
} as const;

export interface CreateLanguageRequest {
  name: string;
}

export interface UpdateLanguageRequest {
  id: number;
  name: string;
}

export interface LanguageDto {
  id: number;
  name: string;
}

export interface CountryDto {
  id: number;
  name: string;
}

export interface CreateCountryRequest {
  name: string;
}

export interface UpdateCountryRequest {
  id: number;
  name: string;
}

export interface FormatDto {
  id: number;
  name: string;
}

export interface CreatePublisherRequest {
  name: string;
  description: string;
  countryId: number;
}

export interface UpdatePublisherRequest {
  id: number;
  name: string;
  description: string;
  countryId: number;
}

export interface CreateFormatRequest {
  name: string;
}

export interface UpdateFormatRequest {
  id: number;
  name: string;
}

export interface PersonDto {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemeDto {
  id: number;
  name: string;
  parentThemeId?: number | null;
  parentThemeName?: string | null;
  subThemesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemeDto {
  id: number;
  name: string;
}

export interface PublisherDto {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string | null;
  countryId: number;
  countryName?: string | null;
}

export interface PersonDetails {
  id: number;
  fullName: string;
}

export interface BookPersonGroupDetails {
  role: number;
  // roleName: string;
  persons: PersonDetails[];
}

export interface RoleDetails {
  id: number;
  name: string;
}

export interface ReferenceContextState {
  roles: RoleDetails[];
  isLoading: boolean;
  error: string | null;
}

export interface PublisherDetails {
  id: number;
  name: string;
}

export interface ThemeDeatils {
  id: number;
  name: string;
}

export interface LanguageDetails {
  id: number;
  name: string;
}

export interface CountryDetails {
  id: number;
  name: string;
}

export interface PagedResult<T> {
  items: T[];
  limit: number;
  hasNext: boolean;
  lastId: number | null;
}

export interface ThemeDto {
  id: number;
  name: string;
}

export interface TagType {
  id: number;
  name: string;
}

export interface TagDetails {
  id: number;
  name: string;
  tagTypeId: number;
  tagTypeName?: string;
  parentTagId?: number;
  parentTagName?: string;
  relationTypeName?: string;
  hasChildren: boolean;
}

export interface CreatePersonRequest {
  name: string;
  description: string;
}

export interface UpdatePersonRequest {
  id: number;
  name: string;
  description: string;
}

export interface LanguageDto {
  id: number;
  name: string;
}
export interface CountryDto {
  id: number;
  name: string;
}
export interface PersonRoleDto {
  id: number;
  name: string;
}

export interface PersonSuggestionDto {
  id: number;
  name: string;
  imagePath: string | null;
}

export interface TagSuggestionDto {
  id: number;
  name: string;
  matchedName: string | null;
}

export const TAG_TYPES = [
  { id: 1, name: 'Время' },
  { id: 2, name: 'Место' },
  { id: 3, name: 'Социум' },
] as const;

// Типы отношений (синонимия — единственный тип сейчас, но структура расширяема)
export const RELATION_TYPES = [
  {
    id: 1,
    name: 'Синоним',
  },
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

export interface CreateThemeRequest {
  name: string;
  parentThemeId?: number | null;
}

export interface UpdateThemeRequest {
  id: number;
  name: string;
  parentThemeId?: number | null;
}
