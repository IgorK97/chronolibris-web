export interface CommentDto {
  id: number;
  text?: string;
  createdAt: string;
  deletedAt?: string;
  userLogin?: string;
  userVote?: boolean;
  likesCount: number;
  dislikesCount: number;
  parentCommentId: number | null;
  replies?: CommentDto[];
  repliesCount: number;
}

export interface CreateCommentRequest {
  bookId: number;
  text: string;
  parentCommentId?: number | null;
}
