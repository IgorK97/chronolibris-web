import React from 'react';
import { Heart } from 'lucide-react';
import type { BookListItem } from '@/types';
import {
  favColor,
  fillFavColor,
  fillUnfavColor,
  unfavColor,
} from '../../../utils';
// import { collectionsApi } from "../../../../api/collections";
// import { useStore } from "../../../../stores/globalStore";

import styles from './BookCard.module.css';
import { useStore } from '@/stores/globalStore';

interface BookCardProps {
  bookInfo: BookListItem;
  onPress: () => void;
  onFavoriteToggle?: (bookId: number, currentIsFavorite: boolean) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  bookInfo,
  onPress,
  onFavoriteToggle,
}) => {
  // const [isFavorite, setIsFavorite] = useState(bookInfo.isFavorite);
  // const { shelves } = useStore();
  const { user } = useStore();
  const coverUrl = import.meta.env.VITE_STORAGE_URL;
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(bookInfo.id, bookInfo.isFavorite);
    }
  };
  return (
    <div className={styles['card']}>
      <div className={styles['image-wrapper']} onClick={onPress}>
        <img
          src={`${coverUrl}/${bookInfo.coverUri}`}
          alt={bookInfo.title}
          className={styles['image']}
          loading="lazy"
        />

        {user?.role == 'reader' && (
          <button
            type="button"
            className={styles['favorite-button']}
            onClick={handleFavoriteClick}
            aria-label="Toggle favorite"
          >
            <Heart
              size={16}
              color={bookInfo.isFavorite ? favColor : unfavColor}
              fill={bookInfo.isFavorite ? fillFavColor : fillUnfavColor}
            />
          </button>
        )}
      </div>

      <h3 className={styles['book-title']}>{bookInfo.title}</h3>
      {bookInfo.authors.length > 0 && (
        <div className={styles['authors']} title={bookInfo.authors.join(', ')}>
          {bookInfo.authors.join(', ')}
        </div>
      )}
    </div>
  );
};
