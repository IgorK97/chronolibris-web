import {
  // React,
  useEffect,
  useState,
} from 'react';
import { FiStar, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import styles from './ReviewCard.module.css';
// Adjust these imports based on your web project structure
import { reviewsApi } from '../../../../api/reviews';
import { useStore } from '../../../../stores/globalStore';

type UserRatingStatus = 'like' | 'dislike' | null;

interface ReviewCardProps {
  id: number;
  author: string;
  date: Date;
  rating: number;
  text: string;
  likes: number;
  dislikes: number;
  onRatingSuccess?: () => void;
  initialUserStatus: UserRatingStatus;
}

export function ReviewCard({
  author,
  date,
  rating,
  text,
  likes,
  dislikes,
  id,
  onRatingSuccess,
  initialUserStatus,
}: ReviewCardProps) {
  const [userLike, setUserLike] = useState<UserRatingStatus>(null);
  const [likeCount, setLikeCount] = useState(likes);
  const [dislikeCount, setDislikeCount] = useState(dislikes);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useStore();

  const LIKE_COLOR = '#dc2626';
  const DISLIKE_COLOR = '#3b82f6';
  const INACTIVE_COLOR = '#6b7280';

  useEffect(() => {
    setUserLike(initialUserStatus);
  }, [initialUserStatus]);

  const sendRatingRequest = async (Score: number) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await reviewsApi.rateReview({
        reviewId: id,
        userId: user?.userId,
        score: Score,
      });
      onRatingSuccess?.();
    } catch (e) {
      console.error('Error sending rating:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLike = () => {
    if (isProcessing) return;
    let newStatus: UserRatingStatus;
    let isRequestLike: number;

    if (userLike === 'like') {
      setLikeCount((c) => c - 1);
      newStatus = null;
      isRequestLike = 0;
    } else {
      if (userLike === 'dislike') {
        setDislikeCount((c) => c - 1);
      }
      setLikeCount((c) => c + 1);
      newStatus = 'like';
      isRequestLike = 1;
    }

    setUserLike(newStatus);
    sendRatingRequest(isRequestLike);
  };

  const handleDislike = () => {
    if (isProcessing) return;
    let newStatus: UserRatingStatus = null;
    let isRequestDislike: number;

    if (userLike === 'dislike') {
      setDislikeCount((c) => c - 1);
      newStatus = null;
      isRequestDislike = 0;
    } else {
      if (userLike === 'like') {
        setLikeCount((c) => c - 1);
      }
      setDislikeCount((c) => c + 1);
      newStatus = 'dislike';
      isRequestDislike = -1;
    }

    setUserLike(newStatus);
    sendRatingRequest(isRequestDislike);
  };

  const strDate = date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className={styles['card']}>
      <div className={styles['stars']}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={16}
            fill={star <= rating ? '#facc15' : 'transparent'}
            color={star <= rating ? '#facc15' : '#d1d5db'}
          />
        ))}
      </div>

      <div className={styles['header']}>
        <h4 className={styles['author']}>{author}</h4>
        <span className={styles['date']}>{strDate}</span>
      </div>

      <p className={styles['text']}>{text}</p>

      <div className={styles['actions']}>
        <button
          className={styles['action-button']}
          onClick={handleLike}
          disabled={isProcessing}
          aria-label="Like"
        >
          <FiThumbsUp
            size={16}
            color={userLike === 'like' ? LIKE_COLOR : INACTIVE_COLOR}
          />
          <span
            className={`${styles['action-text']} ${userLike === 'like' ? styles['like-active'] : ''}`}
          >
            {likeCount}
          </span>
        </button>

        <button
          className={styles['action-button']}
          onClick={handleDislike}
          disabled={isProcessing}
          aria-label="Dislike"
        >
          <FiThumbsDown
            size={16}
            color={userLike === 'dislike' ? DISLIKE_COLOR : INACTIVE_COLOR}
          />
          <span
            className={`${styles['action-text']} ${userLike === 'dislike' ? styles['dislike-active'] : ''}`}
          >
            {dislikeCount}
          </span>
        </button>
      </div>
    </div>
  );
}
