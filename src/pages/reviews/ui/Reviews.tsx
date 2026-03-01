import React, {
  // useEffect,
  useState,
  useRef,
} from 'react';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import { Star } from 'lucide-react'; // Standard Lucide for Web
import { useTranslation } from 'react-i18next';
import styles from './Reviews.module.css';

import { ReviewCard } from '../../../components';
import { useStore } from '../../../stores/globalStore';
// import usePaginationReviews from "../../hooks/usePaginationReviews";
import { reviewsApi, useInfiniteReviews } from '../../../api/reviews';
import type { ReviewDetails } from '../../../types/types';

interface ReviewsProps {
  onNavigate: () => void;
}

export const Reviews = ({ onNavigate }: ReviewsProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const { user, currentBook } = useStore();

  const {
    data: reviews,
    refetch,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    // loadingMore,
    // hasNext,
    // fetchReviews,
    // loadMoreReviews,
    // refresh,
  } = useInfiniteReviews(currentBook?.id ?? 0, user?.userId ?? 0);
  //  usePaginationReviews();

  // useEffect(() => {
  //   if (!currentBook || !user) return;
  //   fetchReviews(currentBook?.id, null, 10, user.userId);
  // }, [currentBook?.id, user?.userId]);

  // Pagination Logic for Web
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (
      !currentBook ||
      !user ||
      !hasNextPage ||
      isLoading ||
      isFetchingNextPage
    )
      return;

    const target = e.currentTarget;
    const isCloseToBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 500;

    if (isCloseToBottom) {
      // loadMoreReviews(currentBook?.id, 10, user.userId);
      fetchNextPage();
    }
  };

  const handleSendReview = async () => {
    if (newReviewText.trim() === '' || newRating === 0 || !user || !currentBook)
      return;

    try {
      await reviewsApi.create({
        bookId: currentBook.id,
        description: newReviewText,
        score: newRating,
        title: 'Review',
        userId: user.userId,
        userName: user.firstName,
      });

      setNewReviewText('');
      setNewRating(0);
      setIsModalVisible(false);
      // refresh(currentBook.id, 10, user.userId);
      refetch();
    } catch (e) {
      console.error('Failed to send review:', e);
    }
  };

  return (
    <div className={styles['container']}>
      {/* Header */}
      <header className={styles['header']}>
        <button onClick={onNavigate} className={styles['back-button']}>
          <FiArrowLeft size={24} color="#000" />
        </button>
        <h1 className={styles['header-title']}>{t('reviews.title')}</h1>
      </header>

      {/* Review List */}
      <div
        className={styles['review-list']}
        onScroll={handleScroll}
        ref={listRef}
      >
        {reviews?.pages.map((page, index) => (
          <React.Fragment key={index}>
            {page.items.map((review: ReviewDetails) => (
              <ReviewCard
                key={review.id}
                id={review.id}
                author={review.userName}
                date={new Date(review.createdAt)}
                rating={review.score}
                text={review.text}
                likes={review.likesCount}
                dislikes={review.dislikesCount}
                initialUserStatus={
                  review.userVote === true
                    ? 'like'
                    : review.userVote === false
                      ? 'dislike'
                      : null
                }
              />
            ))}
          </React.Fragment>
        ))}

        {(isLoading || isFetchingNextPage) && (
          <p style={{ textAlign: 'center' }}>{t('common.loading')}</p>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        className={styles['add-button']}
        onClick={() => setIsModalVisible(true)}
      >
        {t('reviews.write')}
      </button>

      {/* Modal / Overlay */}
      {isModalVisible && (
        <div
          className={styles['modal-overlay']}
          onClick={() => setIsModalVisible(false)}
        >
          <div
            className={styles['modal-container']}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles['modal-header']}>
              <h2 className={styles['modal-title']}>{t('reviews.new')}</h2>
              <button
                className={styles['close-button']}
                onClick={() => setIsModalVisible(false)}
              >
                <FiX size={24} color="#000" />
              </button>
            </div>

            <div className={styles['rating-row']}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={styles['star-button']}
                  onClick={() => setNewRating(star)}
                >
                  <Star
                    size={28}
                    fill={star <= newRating ? '#FFD700' : 'none'}
                    color={star <= newRating ? '#FFD700' : '#CCC'}
                  />
                </button>
              ))}
            </div>

            <textarea
              className={styles['input']}
              placeholder={t('reviews.ph')}
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
            />

            <button
              className={styles['send-button']}
              onClick={handleSendReview}
              disabled={newReviewText.trim() === '' || newRating === 0}
            >
              {t('reviews.send')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
