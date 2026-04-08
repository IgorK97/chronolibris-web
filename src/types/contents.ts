import type {
  BookPersonGroupDetails,
  PersonRoleFilter,
  TagDetails,
  ThemeDto,
} from './references';

export interface ContentDto {
  id: number;
  title: string;
  description: string;
  countryId: number;
  countryName?: string | null;
  contentTypeId: number;
  contentType?: string | null;
  languageId: number;
  languageName?: string | null;
  year?: number | null;
  // parentContentId?: number | null;
  // position?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  authors: string[];
  themes: ThemeDto[];
  booksCount: number;
  tags: TagDetails[];
}

export interface ContentListResponse {
  items: ContentDto[];
  nextCursor?: string | null;
  prevCursor?: string | null;
  totalCount: number;
  hasMore: boolean;
}

export interface ContentFilterRequest {
  searchQuery?: string | null;
  authorName?: string | null;
  personFilters?: PersonRoleFilter[];
  cursor?: string | null;
  limit?: number;
}

export interface ContentDto {
  id: number;
  title: string;
  description: string;
  countryId: number;
  countryName?: string | null;
  contentTypeId: number;
  contentType?: string | null;
  languageId: number;
  languageName?: string | null;
  year?: number | null;
  parentContentId?: number | null;
  position?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  authors: string[];
  participants: BookPersonGroupDetails[];
  themes: ThemeDto[];
}

export interface CreateContentRequest {
  title: string;
  description: string;
  countryId: number;
  contentTypeId: number;
  languageId: number;
  year?: number | null;
  parentContentId?: number | null;
  position?: number | null;
  personIds?: number[];
  themeIds?: number[];
}

export interface UpdateContentRequest {
  id: number;
  title: string;
  description: string;
  countryId: number;
  contentTypeId: number;
  languageId: number;
  year?: number | null;
  yearProvided: boolean;
  parentContentId?: number | null;
  position?: number | null;
  personFilters?: PersonRoleFilter[];
  themeIds?: number[];
}

export interface BookContentLinkRequest {
  contentId: number;
  bookId: number;
  order: number;
}

export type PatchContentRequest = Partial<UpdateContentRequest> & {
  id: number;
};
