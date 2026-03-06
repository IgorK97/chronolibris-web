// ManagedBookCard.tsx
import React, { useState } from 'react';
import { MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { getImageUrl } from '../../../utils';
import styles from '@/components/books/ui/BookCard/BookCard.module.css';
import type { BookListItem } from '@/types/types';

interface Props {
  book: BookListItem;
  onRemove: (id: number) => void;
  onEdit: (book: BookListItem) => void;
  onPress: () => void;
}

export const ManagedBookCard = ({ book, onRemove, onEdit, onPress }: Props) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={styles['card']}>
      <div className={styles['image-wrapper']}>
        <img
          src={getImageUrl(book.coverUri)}
          onClick={onPress}
          className={styles['image']}
          alt={book.title}
        />

        <div className={styles['menu-container']}>
          <button
            className={styles['menu-trigger']}
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className={styles['dropdown']}>
              <button
                onClick={() => {
                  onEdit(book);
                  setShowMenu(false);
                }}
              >
                <Edit3 size={14} /> Редактировать
              </button>
              <button
                onClick={() => {
                  onRemove(book.id);
                  setShowMenu(false);
                }}
                className={styles['delete-option']}
              >
                <Trash2 size={14} /> Удалить из списка
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={styles['info']} onClick={onPress}>
        <h4 className={styles['book-title']}>{book.title}</h4>
        <p className={styles['book-author']}>{book.authors?.join(', ')}</p>
      </div>
    </div>
  );
};
