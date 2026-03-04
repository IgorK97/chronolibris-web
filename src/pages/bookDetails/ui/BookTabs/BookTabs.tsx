import { useState } from 'react';
import styles from './BookTabs.module.css';
import { CommentsSection } from './CommentsSection';
import { ReviewsSection } from './ReviewsSection';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'info' | 'discussion' | 'reviews';

interface BookTabsProps {
  /** Slot for the "Информация" tab content — pass whatever info panel you have */
  infoContent?: React.ReactNode;
  /** Whether this book supports ratings/reviews */
  canReview: boolean;
  discussionCount?: number;
  reviewsCount?: number;
  bookId: number;
  isAuth: boolean;
  userReviewId: number | null; // If the user has already reviewed, their review ID (for edit/delete)
  userCurrentScore: number; // If the user has already reviewed, their current rating score
  userReviewText: string | undefined;
  userReviewStatus: string | undefined;
  onRatingChanged: () => void; // Callback when user changes their rating
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookTabs({
  infoContent,
  canReview,
  discussionCount,
  reviewsCount,
  bookId,
  isAuth,
  userReviewId,
  userCurrentScore,
  userReviewStatus,
  userReviewText,
  onRatingChanged,
}: BookTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('discussion');

  const tabs: {
    id: TabId;
    label: string;
    count?: number;
    disabled?: boolean;
  }[] = [
    { id: 'info', label: 'Информация' },
    { id: 'discussion', label: 'Обсуждение', count: discussionCount },
    {
      id: 'reviews',
      label: 'Отзывы',
      count: reviewsCount,
      disabled: !canReview,
    },
  ];

  return (
    <div className={styles['tabs-root']}>
      {/* Tab bar */}
      <div className={styles['tab-bar']} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            disabled={tab.disabled}
            className={`${styles['tab-btn']} ${activeTab === tab.id ? styles['tab-btn--active'] : ''} ${tab.disabled ? styles['tab-btn--disabled'] : ''}`}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={styles['tab-count']}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'info' && (
        <div className={styles['tab-content']}>
          {infoContent ?? (
            <p className={styles['tab-empty']}>
              Дополнительная информация недоступна.
            </p>
          )}
        </div>
      )}
      {activeTab === 'discussion' && <CommentsSection />}
      {activeTab === 'reviews' && (
        <ReviewsSection
          canReview={canReview}
          bookId={bookId}
          isAuth={isAuth}
          userReviewId={userReviewId}
          userCurrentScore={userCurrentScore}
          onRatingChanged={onRatingChanged}
          userReviewStatus={userReviewStatus}
          userReviewText={userReviewText}
        />
      )}
    </div>
  );
}
