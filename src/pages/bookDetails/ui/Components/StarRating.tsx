import React, { useState, useRef, useEffect } from 'react';
import { pluralize } from '@/utils';
import { useTranslation } from 'react-i18next';
import styles from '../BookDetails.module.css';

interface StarRatingProps {
  averageRating: number;
  ratingsCount: number;
  userRating: number;
  isReader: boolean;
  hasReview: boolean;
  isDeleting?: boolean;
  onRate: (rating: number) => Promise<void>;
  onDeleteClick: () => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  averageRating,
  ratingsCount,
  userRating,
  isReader,
  hasReview,
  isDeleting,
  onRate,
  onDeleteClick,
}) => {
  const { t } = useTranslation();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (!isReader) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsPopupOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsPopupOpen(false);
      setHoverRating(0);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <div className={styles['stat-block']}>
      <div
        className={styles['rating-trigger']}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-testid="rating-trigger"
      >
        <span className={styles['stat-icon']}>★</span>
        <div className={styles['stat-content']}>
          <span className={styles['stat-score']}>
            {averageRating?.toFixed(1)}
          </span>
          <span className={styles['stat-count']}>
            {ratingsCount}{' '}
            {pluralize(
              ratingsCount,
              t('book.rating.one'),
              t('book.rating.few'),
              t('book.rating.many')
            )}
          </span>
        </div>

        {userRating > 0 && (
          <span className={styles['user-rating-badge']}>
            {t('book.your_rating')}: {userRating.toFixed(1)}★
          </span>
        )}

        {isPopupOpen && (
          <div className={styles['rating-popup']} data-testid="rating-popup">
            <span className={styles['rating-popup-title']}>
              {userRating ? t('book.change_rating') : t('book.rate_book')}
            </span>
            <div className={styles['stars-row']}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  data-testid={`star-${star}`}
                  className={`${styles['star-btn']} ${
                    star <= (hoverRating || userRating)
                      ? styles['star-btn-active']
                      : ''
                  }`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => onRate(star)}
                >
                  ★
                </button>
              ))}
            </div>
            {hasReview && (
              <div className={styles['delete-section']}>
                <hr className={styles['separator']} />
                <button
                  className={styles['delete-review-btn']}
                  onClick={onDeleteClick}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? t('common.deleting')
                    : t('book.delete_rating_and_review')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
