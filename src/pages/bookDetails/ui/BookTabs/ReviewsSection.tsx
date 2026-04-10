import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '@/utils';
import {
  Avatar,
  VoteButton,
  ScoreDisplay,
  ThreeDotsMenu,
  // ComposeBox,
  SmartTextBox,
} from './BookTabsAtoms';
import styles from './BookTabs.module.css';
import {
  useInfiniteReviews,
  useCreateReview,
  useUpdateReview,
  reviewsApi,
  useDeleteReview,
} from '@/api/reviews';
import type { ReviewDetails } from '@/types';
import { useStore } from '@/stores/globalStore';
import { TARGET_TYPE } from '@/types';
import { renderFormattedText } from './utils';

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className={styles['review-stars']}
      aria-label={`Оценка: ${rating} из 5`}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`${styles['review-star']} ${s <= rating ? styles['review-star-filled'] : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

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

const TRUNCATE_LINES = 5;

function ReviewItem({
  review,
  isAuth,
  canDelete,
  onDelete,
}: {
  review: ReviewDetails;
  isAuth: boolean;
  canDelete: boolean;
  onDelete: () => Promise<void>;
}) {
  const { user } = useStore();
  // console.log(canDelete, isAuth, review.userName, 'TRUTATA');

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
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const overflowing =
          textRef.current.scrollHeight > textRef.current.clientHeight;
        setIsOverflowing(overflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [review.text]);

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!isAuth) return;
    const score = type === 'like' ? 1 : -1;

    //Оптимистичное обновление
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
            {user?.role == 'reader' && (
              <ThreeDotsMenu
                canDelete={canDelete}
                onDelete={onDelete}
                targetId={review.id}
                targetTypeId={TARGET_TYPE.REVIEW}
              />
            )}
          </div>

          <div
            className={`${styles['review-text-wrap']} ${expanded ? styles['review-text-wrap-expanded'] : ''}`}
            style={{ ['--lines' as string]: TRUNCATE_LINES }}
          >
            {/* <p className={styles['comment-text']}>{review.text}</p> */}
            {renderFormattedText(review.text!)}
          </div>

          {isOverflowing && (
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
          )}

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

interface ReviewsSectionProps {
  canReview: boolean;
  bookId: number;
  isAuth: boolean;
  userReviewId: number | null;
  userCurrentScore: number;
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
  onRatingChanged,
}: ReviewsSectionProps) {
  const [pickedRating, setPickedRating] = useState<number>(userCurrentScore);
  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

    try {
      await deleteReview.mutateAsync(reviewId);
      onRatingChanged();
    } catch (error) {
      console.error('Ошибка при удалении:', error);
    }
  };

  useEffect(() => {
    setPickedRating(userCurrentScore);
  }, [userCurrentScore]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteReviews(bookId, isAuth);

  const allReviews: ReviewDetails[] = data?.pages.flatMap((p) => p.items) ?? [];
  const { user } = useStore();
  const createReview = useCreateReview(bookId);
  const updateReview = useUpdateReview(bookId);
  const deleteReview = useDeleteReview(bookId);

  const handlePickRating = async (rating: number) => {
    if (!isAuth) return;

    setPickedRating(rating);

    if (userReviewId) {
      await updateReview.mutateAsync({
        reviewId: userReviewId,
        score: rating,
        reviewText:
          allReviews.find((r) => r.id === userReviewId)?.text || undefined,
      });
    } else {
      await createReview.mutateAsync({ bookId, score: rating });
    }
    onRatingChanged();
  };

  const handleSubmit = async (text: string) => {
    if (!isAuth) return;
    if (pickedRating === 0) return;

    try {
      if (userReviewId) {
        await updateReview.mutateAsync({
          reviewId: userReviewId,
          score: pickedRating,
          reviewText: text,
        });
      } else {
        await createReview.mutateAsync({
          bookId,
          score: pickedRating,
          reviewText: text,
        });
      }
      onRatingChanged();
    } catch {
      // setSubmitStatus('error');
    }
  };

  const isMutating = createReview.isPending || updateReview.isPending;

  return (
    <div className={styles['tab-content']}>
      {canReview && user?.role == 'reader' && (
        <SmartTextBox
          placeholder="Поделитесь своим впечатлением о книге..."
          onSubmit={handleSubmit}
          type="review"
          onDelete={() => userReviewId && handleDeleteReview(userReviewId)}
          initialText={userReviewText || ''}
          isReadOnly={!!userReviewText}
        >
          <StarPicker
            value={pickedRating}
            onChange={handlePickRating}
            disabled={isMutating}
          />
        </SmartTextBox>
      )}
      {!canReview && (
        <div className={styles['reviews-locked']}>
          Рецензии для этой книги недоступны
        </div>
      )}

      {isLoading && <p className={styles['tab-empty']}>Загрузка отзывов...</p>}
      {isError && (
        <p className={styles['tab-empty']}>
          Не удалось загрузить отзывы. Попробуйте позже.
        </p>
      )}

      <div className={styles['comment-list']}>
        {allReviews.map((r) => (
          <ReviewItem
            key={r.id}
            review={r}
            isAuth={isAuth}
            canDelete={isAuth && r.userName === user?.userName}
            onDelete={() => handleDeleteReview(r.id)}
          />
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
