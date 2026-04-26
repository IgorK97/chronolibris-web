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
