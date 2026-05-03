import React from 'react';
import { Heart, PlusCircle } from 'lucide-react';
import type { BookListItem } from '@/types';
import {
  favColor,
  fillFavColor,
  fillUnfavColor,
  unfavColor,
} from '../../../utils';
// import { collectionsApi } from "../../../../api/collections";
// import { useStore } from "../../../../stores/globalStore";

import styles from './index.module.css';
import { useStore } from '@/stores/globalStore';

interface BookCardProps {
  bookInfo: BookListItem;
  onPress: () => void;
  onFavoriteToggle?: (bookId: number, currentIsFavorite: boolean) => void;
  onSelectionToggle?: (bookId: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  bookInfo,
  onPress,
  onFavoriteToggle,
  onSelectionToggle,
}) => {
  // const [isFavorite, setIsFavorite] = useState(bookInfo.isFavorite);
  // const { shelves } = useStore();
  const { isAdmin, isReader } = useStore();
  const coverUrl = import.meta.env.VITE_STORAGE_URL;
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(bookInfo.id, bookInfo.isFavorite);
    }
  };

  const handleSelectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectionToggle) {
      onSelectionToggle(bookInfo.id);
    }
  };
  return (
    <div className={styles['card']}>
      <div className={styles['image-wrapper']} onClick={onPress}>
        {bookInfo.coverUri ? (
          <img
            src={`${coverUrl}/${bookInfo.coverUri}`}
            alt={bookInfo.title}
            className={styles['image']}
            loading="lazy"
          />
        ) : (
          <div className={styles['image-placeholder']}>
            <span className={styles['image-placeholder-title']}>
              {bookInfo.title}
            </span>
          </div>
        )}

        {isReader() && (
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
        {isAdmin() && onSelectionToggle && (
          <button
            type="button"
            className={styles['favorite-button']}
            onClick={handleSelectionClick}
            aria-label="Добавить в подборку"
          >
            <PlusCircle size={16} />
          </button>
        )}
      </div>

      <h3 title={bookInfo.title} className={styles['book-title']}>
        {bookInfo.title}
      </h3>
      {bookInfo.authors.length > 0 && (
        <div className={styles['authors']} title={bookInfo.authors.join(', ')}>
          {bookInfo.authors.join(', ')}
        </div>
      )}
    </div>
  );
};
