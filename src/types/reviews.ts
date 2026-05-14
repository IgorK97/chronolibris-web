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
  reviewId: number;
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
