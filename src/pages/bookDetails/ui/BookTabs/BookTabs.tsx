import { useState } from 'react';
import styles from './BookTabs.module.css';
import { CommentsSection } from './CommentsSection';
import { ReviewsSection } from './ReviewsSection';

type TabId = 'info' | 'discussion' | 'reviews';

interface BookTabsProps {
  infoContent?: React.ReactNode;
  isReviewable: boolean;
  canReview: boolean;
  discussionCount?: number;
  reviewsCount?: number;
  bookId: number;
  isAuth: boolean;
  userReviewId: number | null;
  userCurrentScore: number;
  userReviewText: string | undefined;
  userReviewStatus: string | undefined;
  onRatingChanged: () => void;
}

interface TabType {
  id: TabId;
  label: string;
  count?: number;
  disabled?: boolean;
}

export function BookTabs({
  infoContent,
  canReview,
  isReviewable,
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

  const tabs: TabType[] = [
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
      <div className={styles['tab-bar']} role="tablist">
        {tabs.map((tab) => {
          if (isReviewable || (!isReviewable && tab.id != 'reviews'))
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                disabled={tab.disabled}
                className={`${styles['tab-btn']} ${activeTab === tab.id ? styles['tab-btn-active'] : ''} ${tab.disabled ? styles['tab-btn-disabled'] : ''}`}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={styles['tab-count']}>{tab.count}</span>
                )}
              </button>
            );
        })}
      </div>

      {activeTab === 'info' && (
        <div className={styles['tab-content']}>
          {infoContent ?? (
            <p className={styles['tab-empty']}>
              Дополнительная информация недоступна.
            </p>
          )}
        </div>
      )}
      {activeTab === 'discussion' && <CommentsSection bookId={bookId} />}
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
