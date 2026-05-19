export interface Bookmark {
  id: number;
  xpointer: string;
  bookFileId: number;
  note?: string;
  context: string;
  createdAt: string;
}

export interface CreateBookmarkRequest {
  bookFileId: number;
  xpointer: string;
  noteText?: string;
  context: string;
}

export interface UpdateBookmarkRequest {
  note?: string;
}

export interface BookmarkWithBookDetails {
  id: number;
  xpointer: string;
  context: string;
  note: string | null;
  createdAt: string;
  bookFileId: number;
  bookFileFormatName: string;
  bookFileFormatId: number;
  bookFileStatusId: number;
  bookId: number;
  bookTitle: string;
}
