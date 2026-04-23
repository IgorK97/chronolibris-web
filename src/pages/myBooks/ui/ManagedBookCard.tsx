import { useState } from 'react';
import { MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { getImageUrl } from '../../../utils';
import styles from '@/components/Books/BookCard/index.module.css';
import type { BookListItem } from '@/types';

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
        {book.coverUri ? (
          <img
            src={getImageUrl(book.coverUri)}
            alt={book.title}
            onClick={onPress}
            className={styles['image']}
            loading="lazy"
          />
        ) : (
          <div className={styles['image-placeholder']}>
            <span className={styles['image-placeholder-title']}>
              {book.title}
            </span>
          </div>
        )}

        <div className={styles['menu-container']}>
          <button
            className={styles['menu-trigger']}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className={styles['dropdown']}>
              <div
                onClick={() => {
                  onEdit(book);
                  setShowMenu(false);
                }}
                className={styles['menu-item']}
              >
                <button type="button">
                  <Edit3 size={14} />
                </button>
                <span className={styles['text-label']}>Редактировать</span>
              </div>
              <div
                className={`${styles['menu-item']} ${styles['delete-wrapper']}`}
                onClick={() => {
                  onRemove(book.id);
                  setShowMenu(false);
                }}
              >
                <button type="button" className={styles['delete-option']}>
                  <Trash2 size={14} />
                </button>
                <span className={styles['text-label']}>Удалить из списка</span>
              </div>
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
