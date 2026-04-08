export interface Bookmark {
  id: number;
  paraIndex: number;
  bookFileId: number;
  note?: string;
  createdAt: string;
}

export interface CreateBookmarkRequest {
  bookFileId: number;
  paraIndex: number;
  noteText?: string;
}

export interface UpdateBookmarkRequest {
  note?: string;
}
