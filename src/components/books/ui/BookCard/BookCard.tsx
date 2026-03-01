import React, { useState } from 'react';
import { Heart } from 'lucide-react'; // Обычный lucide для веба
import type { BookListItem } from '../../../../types/types';
import {
  favColor,
  fillFavColor,
  fillUnfavColor,
  unfavColor,
} from '../../../../utils';
// import { collectionsApi } from "../../../../api/collections";
// import { useStore } from "../../../../stores/globalStore";

import styles from './BookCard.module.css';

interface BookCardProps {
  bookInfo: BookListItem;
  onPress: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ bookInfo, onPress }) => {
  const [isFavorite, setIsFavorite] = useState(bookInfo.isFavorite);
  // const { shelves } = useStore();

  // В Vite используем import.meta.env
  // const BASE_URL = import.meta.env.VITE_PUBLIC_BASE_DEV_URL || '';
  const coverUrl = import.meta.env.VITE_STORAGE_URL;

  // const FAVORITES_SHELF_ID = shelves?.find(
  //   (shelf) => shelf.shelfType === 1,
  // )?.id;

  // const toggleFavorite = async (e: React.MouseEvent) => {
  //   // Останавливаем всплытие, чтобы не срабатывал onPress карточки
  //   e.stopPropagation();

  //   if (!FAVORITES_SHELF_ID) return;

  //   try {
  //     let success = false;
  //     if (!isFavorite) {
  //       success = await collectionsApi.addBookToShelf(
  //         FAVORITES_SHELF_ID,
  //         bookInfo.id,
  //       );
  //     } else {
  //       success = await collectionsApi.removeBookFromShelf(
  //         FAVORITES_SHELF_ID,
  //         bookInfo.id,
  //       );
  //     }

  //     if (success) {
  //       setIsFavorite(!isFavorite);
  //     }
  //   } catch (error) {
  //     console.error("Failed to toggle favorite:", error);
  //   }
  // };

  return (
    <div className={styles['card']}>
      <div className={styles['image-wrapper']} onClick={onPress}>
        <img
          src={`${coverUrl}/${bookInfo.coverUri}`}
          alt={bookInfo.title}
          className={styles['image']}
          loading="lazy"
        />

        <button
          type="button"
          className={styles['favorite-button']}
          onClick={() => setIsFavorite(!isFavorite)}
          aria-label="Toggle favorite"
        >
          <Heart
            size={16}
            color={isFavorite ? favColor : unfavColor}
            fill={isFavorite ? fillFavColor : fillUnfavColor}
          />
        </button>
      </div>

      <h3 className={styles['book-title']}>{bookInfo.title}</h3>
      {/* <p className={styles.bookAuthor}>{bookInfo.author}</p> */}

      {/* Render authors only if the list is not empty */}
      {bookInfo.authors.length > 0 && (
        <div className={styles['authors']} title={bookInfo.authors.join(', ')}>
          {bookInfo.authors.join(', ')}
        </div>
      )}
    </div>
  );
};
