import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
// import type { Review } from './bookTabsData';
import { formatDate } from './BookTabsData';
import {
  Avatar,
  VoteButton,
  ScoreDisplay,
  ThreeDotsMenu,
  ComposeBox,
} from './BookTabsAtoms';
import styles from './BookTabs.module.css';
import {
  useInfiniteReviews,
  useCreateReview,
  useUpdateReview,
  reviewsApi,
  useDeleteReview,
} from '@/api/reviews';
import type { ReviewDetails } from '@/types/types';

// ─── Star row (display only) ──────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className={styles['review-stars']}
      aria-label={`Оценка: ${rating} из 5`}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`${styles['review-star']} ${s <= rating ? styles['review-star--filled'] : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Interactive star picker (for composing) ──────────────────────────────────

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles['star-picker']}>
      <span className={styles['star-picker-label']}>Ваша оценка:</span>
      <div className={styles['star-picker-row']}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            className={`${styles['star-pick-btn']} ${s <= (hover || value) ? styles['star-pick-btn-active'] : ''}`}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => !disabled && onChange(s)}
            type="button"
            disabled={disabled}
            aria-label={`${s} звезд`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className={styles['star-picker-hint']}>
          Вы выбрали {value} из 5
        </span>
      )}
    </div>
  );
}

function SubmitBanner({
  status,
  onDismiss,
}: {
  status: 'pending' | 'error' | null;
  onDismiss: () => void;
}) {
  if (!status) return null;
  return (
    <div
      className={`${styles['submit-banner']} ${
        status === 'error'
          ? styles['submit-banner-error']
          : styles['submit-banner-pending']
      }`}
    >
      {status === 'pending'
        ? '✓ Отзыв отправлен и будет опубликован после проверки модератором.'
        : '✗ Не удалось отправить отзыв. Попробуйте ещё раз.'}
      <button className={styles['submit-banner-close']} onClick={onDismiss}>
        ✕
      </button>
    </div>
  );
}

// ─── Single review ────────────────────────────────────────────────────────────

const TRUNCATE_LINES = 5;

function ReviewItem({
  review,
  isAuth,
}: {
  review: ReviewDetails;
  isAuth: boolean;
}) {
  console.log(review.userVote, review.id);
  const [votes, setVotes] = useState({
    likes: review.likesCount,
    dislikes: review.dislikesCount,

    userVote:
      review.userVote === true
        ? 'like'
        : review.userVote === false
          ? 'dislike'
          : null,
  } as {
    likes: number;
    dislikes: number;
    userVote: 'like' | 'dislike' | null;
  });
  const [expanded, setExpanded] = useState(false);

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!isAuth) return; // guard: must be authenticated to vote
    const score = type === 'like' ? 1 : -1;

    // Optimistic UI update
    setVotes((prev) => {
      if (prev.userVote === type) {
        return {
          likes: type === 'like' ? prev.likes - 1 : prev.likes,
          dislikes: type === 'dislike' ? prev.dislikes - 1 : prev.dislikes,
          userVote: null,
        };
      }
      return {
        likes:
          type === 'like'
            ? prev.likes + 1
            : prev.userVote === 'like'
              ? prev.likes - 1
              : prev.likes,
        dislikes:
          type === 'dislike'
            ? prev.dislikes + 1
            : prev.userVote === 'dislike'
              ? prev.dislikes - 1
              : prev.dislikes,
        userVote: type,
      };
    });

    await reviewsApi.rateReview({
      reviewId: review.id,
      score,
    });
  };

  return (
    <div className={styles['review']}>
      <div className={styles['comment-inner']}>
        <Avatar userName={review.userName} />
        <div className={styles['comment-body']}>
          <div className={styles['comment-header']}>
            <span className={styles['comment-author']}>{review.userName}</span>
            <StarRating rating={review.score} />
            <span className={styles['comment-date']}>
              {formatDate(new Date(review.createdAt).toISOString())}
            </span>
            <ThreeDotsMenu />
          </div>

          {/* Truncated text block */}
          <div
            className={`${styles['review-text-wrap']} ${expanded ? styles['review-text-wrap--expanded'] : ''}`}
            style={{ ['--lines' as string]: TRUNCATE_LINES }}
          >
            <p className={styles['comment-text']}>{review.text}</p>
          </div>

          <button
            className={styles['review-toggle-btn']}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUp size={13} /> Свернуть
              </>
            ) : (
              <>
                <ChevronDown size={13} /> Читать полностью
              </>
            )}
          </button>

          <div className={styles['comment-footer']}>
            <div className={styles['vote-group']}>
              <VoteButton
                type="like"
                count={votes.likes}
                active={votes.userVote === 'like'}
                onClick={() => handleVote('like')}
              />
              <ScoreDisplay likes={votes.likes} dislikes={votes.dislikes} />
              <VoteButton
                type="dislike"
                count={votes.dislikes}
                active={votes.userVote === 'dislike'}
                onClick={() => handleVote('dislike')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reviews section ──────────────────────────────────────────────────────────

type SortMode = 'popular' | 'recent';

interface ReviewsSectionProps {
  canReview: boolean;
  bookId: number;
  isAuth: boolean;
  /** Existing review id, or null when the user hasn't reviewed yet */
  userReviewId: number | null;
  /** Score currently stored on the server (0 = none) */
  userCurrentScore: number;
  /** Callback so parent can refetch book stats after a rating change */
  onRatingChanged: () => void;
  userReviewText?: string | null;
  userReviewStatus?: string | null;
}

export function ReviewsSection({
  canReview,
  bookId,
  isAuth,
  userReviewId,
  userCurrentScore,
  userReviewText,
  userReviewStatus,
  onRatingChanged,
}: ReviewsSectionProps) {
  // const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [sort, setSort] = useState<SortMode>('popular');
  const [pickedRating, setPickedRating] = useState<number>(userCurrentScore);
  const [submitStatus, setSubmitStatus] = useState<'pending' | 'error' | null>(
    null
  );

  const isPending = userReviewStatus === 'На проверке';

  useEffect(() => {
    setPickedRating(userCurrentScore);
  }, [userCurrentScore]);

  const handleDelete = async () => {
    if (!userReviewId) return;
    if (window.confirm('Вы уверены, что хотите удалить свой отзыв?')) {
      await deleteReview.mutateAsync(userReviewId);
      onRatingChanged();
    }
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteReviews(bookId, isAuth);

  const allReviews: ReviewDetails[] = data?.pages.flatMap((p) => p.items) ?? [];

  const createReview = useCreateReview(bookId);
  const updateReview = useUpdateReview(bookId);
  const deleteReview = useDeleteReview(bookId);
  // const sorted = [...reviews].sort((a, b) =>
  //   sort === 'popular'
  //     ? b.likes - b.dislikes - (a.likes - a.dislikes)
  //     : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  // );

  const handlePickRating = async (rating: number) => {
    if (!isAuth) return;

    setPickedRating(rating);

    if (userReviewId) {
      // if (rating === userCurrentScore) {
      //   await deleteReview.mutateAsync(userReviewId);
      //   return;
      // }
      await updateReview.mutateAsync({
        reviewId: userReviewId,
        score: rating,
        // keep existing text if present
        reviewText:
          allReviews.find((r) => r.id === userReviewId)?.text || undefined,
      });
    } else {
      await createReview.mutateAsync({ bookId, score: rating });
    }
    // Tell parent to refresh averageRating in the header
    onRatingChanged();
  };

  const handleSubmit = async (text: string) => {
    if (!isAuth) return; // guard: must be authenticated to submit
    if (pickedRating === 0) return; // guard: need a rating

    try {
      if (userReviewId) {
        // User already has a review (possibly score-only) → update with text
        // Server will move status to Pending because text is being added/changed
        await updateReview.mutateAsync({
          reviewId: userReviewId,
          score: pickedRating,
          reviewText: text,
        });
      } else {
        // No review yet → create with text → server sets status to Pending
        await createReview.mutateAsync({
          bookId,
          score: pickedRating,
          reviewText: text,
        });
      }
      setSubmitStatus('pending'); // show "will be moderated" message
      onRatingChanged();
    } catch {
      setSubmitStatus('error');
    }
    // const newReview: Review = {
    //   id: Date.now(),
    //   author: { id: 0, name: 'Вы' },
    //   text,
    //   rating: pickedRating,
    //   createdAt: new Date().toISOString(),
    //   likes: 0,
    //   dislikes: 0,
    //   userVote: null,
    // };
    // setReviews((prev) => [newReview, ...prev]);
    // setPickedRating(0);
  };

  const isMutating = createReview.isPending || updateReview.isPending;

  return (
    <div className={styles['tab-content']}>
      {/* Баннер модерации: показывается всегда, пока статус Pending */}
      {isPending && (
        <div
          className={`${styles['submit-banner']} ${styles['submit-banner-pending']}`}
        >
          ✓ Ваш отзыв находится на модерации и будет опубликован после проверки.
        </div>
      )}
      <SubmitBanner
        status={submitStatus}
        onDismiss={() => setSubmitStatus(null)}
      />
      {canReview ? (
        <ComposeBox
          placeholder="Поделитесь своим впечатлением о книге..."
          onSubmit={handleSubmit}
          type="review"
          onDelete={handleDelete}
          initialText={userReviewText || ''}
          isReadOnly={!!userReviewText}
        >
          <StarPicker
            value={pickedRating}
            onChange={handlePickRating}
            disabled={isMutating}
          />
        </ComposeBox>
      ) : (
        <div className={styles['reviews-locked']}>
          Рецензии для этой книги недоступны
        </div>
      )}

      <div className={styles['sort-row']}>
        <div className={styles['sort-tabs']}>
          <button
            className={`${styles['sort-tab']} ${sort === 'popular' ? styles['sort-tab--active'] : ''}`}
            onClick={() => setSort('popular')}
          >
            Популярные
          </button>
          <button
            className={`${styles['sort-tab']} ${sort === 'recent' ? styles['sort-tab--active'] : ''}`}
            onClick={() => setSort('recent')}
          >
            Новые
          </button>
        </div>
        <span className={styles['sort-count']}>
          {allReviews.length} рецензий
        </span>
      </div>

      {isLoading && <p className={styles['tab-empty']}>Загрузка отзывов...</p>}
      {isError && (
        <p className={styles['tab-empty']}>
          Не удалось загрузить отзывы. Попробуйте позже.
        </p>
      )}

      <div className={styles['comment-list']}>
        {allReviews.map((r) => (
          <ReviewItem key={r.id} review={r} isAuth={isAuth} />
        ))}
      </div>

      {hasNextPage && (
        <button
          className={styles['load-more-btn']}
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Загрузка...' : 'Загрузить еще'}
        </button>
      )}
    </div>
  );
}
