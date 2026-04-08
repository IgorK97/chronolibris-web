import type {
  BookPersonGroupDetails,
  CountryDetails,
  LanguageDetails,
  PersonRoleFilter,
  PublisherDetails,
  ThemeDeatils,
  ThemeDto,
} from './references';

export interface BookFileDto {
  id: number;
  bookId: number;
  formatId: number;
  formatName?: string | null;
  storageUrl: string;
  fileSizeBytes: number;
  fileSizeDisplay: string;
  isReadable: boolean;
  createdAt: string;
  completedAt?: string | null;
  createdBy: number;
  createdByName?: string | null;
  version: number;
  bookFileStatusId: number;
  bookFileStatusName?: string | null;
}

export interface BookDto {
  id: number;
  title: string;
  description: string;
  countryId: number;
  countryName?: string | null;
  languageId: number;
  languageName?: string | null;
  year?: number | null;
  isbn?: string | null;
  coverPath?: string | null;
  isAvailable: boolean;
  isReviewable: boolean;
  publisherId?: number | null;
  publisherName?: string | null;
  seriesId?: number | null;
  seriesName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  authors: string[];
  themes: ThemeDto[];
}

export interface BookListResponse {
  items: BookDto[];
  nextCursor?: string | null;
  prevCursor?: string | null;
  totalCount: number;
  hasMore: boolean;
}

export interface BookFilterRequest {
  searchQuery?: string | null;
  authorName?: string | null;
  includeThemeIds?: number[] | null;
  excludeThemeIds?: number[] | null;
  publisherId?: number | null;
  seriesId?: number | null;
  languageId?: number | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  isAvailable?: boolean | null;
  cursor?: string | null;
  limit?: number;
}

export interface BookListItem {
  id: number;
  title: string;
  coverUri: string | null;
  averageRating: number;
  ratingsCount: number;
  isFavorite: boolean;
  authors: string[];
  isReviewable: boolean;
}

export interface CreateBookRequest {
  title: string;
  description?: string | null;
  countryId: number;
  languageId: number;
  year?: number | null;
  isbn?: string | null;
  bbk?: string | null;
  udk?: string | null;
  source?: string | null;
  coverBase64: string;
  coverContentType: string;
  isAvailable: boolean;
  isReviewable: boolean;
  publisherId?: number | null;
  personFilters?: PersonRoleFilter[];
  //   themeIds?: number[];
}

// export interface UpdateBookRequest {
//   id: number;
//   title: string;
//   description: string;
//   countryId: number | null;
//   languageId: number | null;
//   year: number | null;
//   yearProvided: boolean;
//   isbn: string | null;
//   isbnProvided: boolean;
//   bbk: string | null;
//   bbkProvided: boolean;
//   udk: string | null;
//   udkProvided: boolean;
//   source: string | null;
//   sourceProvided: boolean;
//   // filePath?: string | null;
//   // coverFile: File | null;
//   coverBase64: string | null;
//   coverContentType: string | null;
//   isAvailable: boolean;
//   isReviewable: boolean;
//   publisherId: number | null;
//   publisherIdProvided: boolean;
//   seriesId: number | null;
//   seriesIdProvided: boolean;
//   personFilters?: PersonRoleFilter[];
// }

export interface UpdateBookRequest {
  id: number;
  title: string;
  description?: string | null;
  countryId?: number | null;
  languageId?: number | null;
  year?: number | null;
  yearProvided: boolean;
  isbn?: string | null;
  isbnProvided: boolean;
  bbk?: string | null;
  bbkProvided: boolean;
  udk?: string | null;
  udkProvided: boolean;
  source?: string | null;
  sourceProvided: boolean;
  coverBase64?: string | null;
  coverContentType?: string | null;
  coverFileName?: string | null;
  isAvailable: boolean;
  isReviewable: boolean;
  publisherId?: number | null;
  publisherIdProvided: boolean;
  personFilters?: PersonRoleFilter[];
  //   themeIds?: number[];
}

export interface BookDetails {
  id: number;
  title: string;
  year: number | null;
  description: string;
  isbn: string | null;
  averageRating: number;
  ratingsCount: number;
  reviewsCount: number;
  commentsCount: number;
  coverUri: string | null;
  isAvailable: boolean;
  isFavorite: boolean;
  isRead: boolean;
  isReviewable: boolean;
  publisher: PublisherDetails | null;
  // country: string | null;
  country: CountryDetails | null;
  // language: string;
  language: LanguageDetails | null;
  participants: BookPersonGroupDetails[];
  themes: ThemeDeatils[];
  userRating: number;
  bbk?: string;
  udk?: string;
  source?: string;
}

export interface SelectionDetails {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  booksCount: number;
  isActive?: boolean;
}

export interface UpdateReadingProgressCommand {
  userId: number;
  bookId: number;
  readingProgress: number;
}

export interface BookFilters {
  languages: string[];
  genreIds: number[];
  rating: number | null;
  yearFrom: string;
  yearTo: string;
}

export interface BookDto {
  id: number;
  title: string;
  description: string;
  countryId: number;
  countryName?: string | null;
  languageId: number;
  languageName?: string | null;
  year?: number | null;
  isbn?: string | null;
  coverPath?: string | null;
  filePath?: string | null;
  isAvailable: boolean;
  isReviewable: boolean;
  isFragment: boolean;
  publisherId?: number | null;
  publisherName?: string | null;
  seriesId?: number | null;
  seriesName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  authors: string[];
  themes: ThemeDto[];
  contentsCount: number;
}

export interface BookListResponse {
  items: BookDto[];
  nextCursor?: string | null;
  prevCursor?: string | null;
  totalCount: number;
  hasMore: boolean;
}

export interface BookFilterRequest {
  searchQuery?: string | null;
  authorName?: string | null;
  includeThemeIds?: number[] | null;
  excludeThemeIds?: number[] | null;
  publisherId?: number | null;
  seriesId?: number | null;
  languageId?: number | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  isAvailable?: boolean | null;
  cursor?: string | null;
  limit?: number;
}

export interface UploadBookFileRequest {
  bookId: number;
  formatId: number;
  isReadable: boolean;
  file: File;
}

export interface UpdateBookFileRequest {
  bookId: number;
  formatId: number;
  isReadable: boolean;
  file: File;
}

export interface SearchParams {
  query: string;
  userId: number;
  lastId?: number;
  limit: number;
  genreIds?: number[];
  languages?: string[];
  rating?: number | null;
  yearFrom?: string;
  yearTo?: string;
}

export interface BookContentLinkRequest {
  bookId: number;
  contentId: number;
  order: number;
}
