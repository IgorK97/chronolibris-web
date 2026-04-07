import type { PersonRoleFilter } from '@/api/contents';

export const SELECTION_TYPE = { NEWEST: 1, POPULAR: 2, MANUAL: 3 } as const;

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

export interface Bookmark {
  id: number;
  paraIndex: number;
  bookFileId: number;
  note?: string;
  createdAt: string;
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

export interface ContentListResponse {
  items: ContentDto[];
  nextCursor?: string | null;
  prevCursor?: string | null;
  totalCount: number;
  hasMore: boolean;
}

export interface BookListResponse {
  items: BookDto[];
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

export interface PublisherDto {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string | null;
  countryId: number;
  countryName?: string | null;
}

export interface CommentDto {
  id: number;
  text?: string;
  createdAt: string;
  userLogin?: string;
  userVote?: boolean;
  likesCount: number;
  dislikesCount: number;
  parentCommentId: number | null;
  replies?: CommentDto[]; // Для первого уровня вложенности
  repliesCount: number;
}

export interface CreateCommentRequest {
  bookId: number;
  text: string;
  parentCommentId?: number | null;
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

export interface CachedRoles {
  roles: RoleDetails[];
  timestamp: number;
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

export interface CreateBookRequest {
  title: string;
  description: string;
  countryId: number;
  languageId: number;
  year: number | null;
  isbn: string | null;
  bbk: string | null;
  udk: string | null;
  source: string | null;
  // filePath?: string | null;
  // coverFile: File;
  coverBase64: string;
  coverContentType: string;
  isAvailable: boolean;
  isReviewable: boolean;
  publisherId: number | null;
  seriesId: number | null;
  personFilters: PersonRoleFilter[];
}

export interface UpdateBookRequest {
  id: number;
  title: string;
  description: string;
  countryId: number | null;
  languageId: number | null;
  year: number | null;
  yearProvided: boolean;
  isbn: string | null;
  isbnProvided: boolean;
  bbk: string | null;
  bbkProvided: boolean;
  udk: string | null;
  udkProvided: boolean;
  source: string | null;
  sourceProvided: boolean;
  // filePath?: string | null;
  // coverFile: File | null;
  coverBase64: string | null;
  coverContentType: string | null;
  isAvailable: boolean;
  isReviewable: boolean;
  publisherId: number | null;
  publisherIdProvided: boolean;
  seriesId: number | null;
  seriesIdProvided: boolean;
  personFilters?: PersonRoleFilter[];
}

export interface LanguageDetails {
  id: number;
  name: string;
}

export interface CountryDetails {
  id: number;
  name: string;
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

export interface ApiError {
  message: string;
  code: number;
}

export interface AddBookmarkCommand {
  bookId?: number;
  userId?: number;
  mark?: string;
  text?: string;
}

export interface RemoveBookmarkCommand {
  bookmarkId?: number;
}

export interface RateReviewCommand {
  reviewId?: number;
  userId?: number;
  score?: number;
}

export interface CreateReviewRequest {
  bookId: number;
  reviewText?: string;
  score: number;
}

export interface UpdateReviewRequest {
  reviewText?: string;
  score: number;
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

export interface PagedResult<T> {
  items: T[];
  limit: number;
  hasNext: boolean;
  lastId: number | null;
}

export interface UpdateReadingProgressCommand {
  userId: number;
  bookId: number;
  readingProgress: number;
}

export interface GetReadBooksQuery {
  UserId: number;
  LastId: number | null;
  Limit: number;
}

export interface BookmarkDetails {
  id: number;
  mark: string;
  text: string;
  createdAt: Date;
}

export interface UserProfile {
  userId: number;
  firstName: string;
  lastName: string;
  email?: string;
  userName: string;
  phoneNumber: string;
  role: string;
}

export interface ReviewDetails {
  id: number;
  title: string;
  userName: string;
  text: string;
  score: number;
  averageRating: number;
  likesCount: number;
  dislikesCount: number;
  createdAt: Date;
  userVote?: boolean;
}

export interface MyReviewDetails {
  id: number;
  title: string;
  userName: string;
  text: string;
  score: number;
  averageRating: number;
  likesCount: number;
  dislikesCount: number;
  createdAt: Date;
  userVote?: boolean;
  status: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email?: string;
  userName: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ShelfDetails {
  id: number;
  name: string;
  shelfType: number;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  message?: string;
}

export interface RegistrationResult {
  success: boolean;
  token: string;
  refreshToken: string;
  message?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userName: string;
  phoneNumber: string;
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface BookFilters {
  languages: string[];
  genreIds: number[];
  rating: number | null;
  yearFrom: string;
  yearTo: string;
}

export interface ThemeDto {
  id: number;
  name: string;
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
