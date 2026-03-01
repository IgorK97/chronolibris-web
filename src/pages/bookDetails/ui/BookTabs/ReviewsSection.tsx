import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Review } from './bookTabsData';
import { MOCK_REVIEWS, formatDate } from './bookTabsData';
import { Avatar, VoteButton, ScoreDisplay, ThreeDotsMenu, ComposeBox } from './BookTabsAtoms';
import styles from './BookTabs.module.css';

// ─── Star row (display only) ──────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className={styles['review-stars']} aria-label={`Оценка: ${rating} из 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`${styles['review-star']} ${s <= rating ? styles['review-star--filled'] : ''}`}>
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Interactive star picker (for composing) ──────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles['star-picker']}>
      <span className={styles['star-picker-label']}>Ваша оценка:</span>
      <div className={styles['star-picker-row']}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            className={`${styles['star-pick-btn']} ${s <= (hover || value) ? styles['star-pick-btn--active'] : ''}`}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(s)}
            type="button"
            aria-label={`${s} звезд`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 && <span className={styles['star-picker-hint']}>Вы выбрали {value} из 5</span>}
    </div>
  );
}

// ─── Single review ────────────────────────────────────────────────────────────

const TRUNCATE_LINES = 5;

function ReviewItem({ review }: { review: Review }) {
  const [votes, setVotes] = useState({
    likes: review.likes,
    dislikes: review.dislikes,
    userVote: review.userVote ?? null,
  });
  const [expanded, setExpanded] = useState(false);

  const handleVote = (type: 'like' | 'dislike') => {
    setVotes((prev) => {
      if (prev.userVote === type) {
        return {
          likes: type === 'like' ? prev.likes - 1 : prev.likes,
          dislikes: type === 'dislike' ? prev.dislikes - 1 : prev.dislikes,
          userVote: null,
        };
      }
      return {
        likes: type === 'like' ? prev.likes + 1 : prev.userVote === 'like' ? prev.likes - 1 : prev.likes,
        dislikes: type === 'dislike' ? prev.dislikes + 1 : prev.userVote === 'dislike' ? prev.dislikes - 1 : prev.dislikes,
        userVote: type,
      };
    });
  };

  return (
    <div className={styles['review']}>
      <div className={styles['comment-inner']}>
        <Avatar author={review.author} />
        <div className={styles['comment-body']}>

          <div className={styles['comment-header']}>
            <span className={styles['comment-author']}>{review.author.name}</span>
            <StarRating rating={review.rating} />
            <span className={styles['comment-date']}>{formatDate(review.createdAt)}</span>
            <ThreeDotsMenu />
          </div>

          {/* Truncated text block */}
          <div className={`${styles['review-text-wrap']} ${expanded ? styles['review-text-wrap--expanded'] : ''}`}
            style={{ ['--lines' as string]: TRUNCATE_LINES }}
          >
            <p className={styles['comment-text']}>{review.text}</p>
          </div>

          <button className={styles['review-toggle-btn']} onClick={() => setExpanded((v) => !v)}>
            {expanded ? (
              <><ChevronUp size={13} /> Свернуть</>
            ) : (
              <><ChevronDown size={13} /> Читать полностью</>
            )}
          </button>

          <div className={styles['comment-footer']}>
            <div className={styles['vote-group']}>
              <VoteButton type="like" count={votes.likes} active={votes.userVote === 'like'} onClick={() => handleVote('like')} />
              <ScoreDisplay likes={votes.likes} dislikes={votes.dislikes} />
              <VoteButton type="dislike" count={votes.dislikes} active={votes.userVote === 'dislike'} onClick={() => handleVote('dislike')} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Reviews section ──────────────────────────────────────────────────────────

type SortMode = 'popular' | 'recent';

export function ReviewsSection({ canReview }: { canReview: boolean }) {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [sort, setSort] = useState<SortMode>('popular');
  const [pickedRating, setPickedRating] = useState(0);

  const sorted = [...reviews].sort((a, b) =>
    sort === 'popular'
      ? (b.likes - b.dislikes) - (a.likes - a.dislikes)
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleSubmit = (text: string) => {
    if (pickedRating === 0) return; // guard: need a rating
    const newReview: Review = {
      id: Date.now(),
      author: { id: 0, name: 'Вы' },
      text,
      rating: pickedRating,
      createdAt: new Date().toISOString(),
      likes: 0, dislikes: 0, userVote: null,
    };
    setReviews((prev) => [newReview, ...prev]);
    setPickedRating(0);
  };

  return (
    <div className={styles['tab-content']}>
      {canReview ? (
        <ComposeBox
          placeholder="Поделитесь своим впечатлением о книге..."
          onSubmit={handleSubmit}
        >
          <StarPicker value={pickedRating} onChange={setPickedRating} />
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
        <span className={styles['sort-count']}>{reviews.length} рецензий</span>
      </div>

      <div className={styles['comment-list']}>
        {sorted.map((r) => (
          <ReviewItem key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}
