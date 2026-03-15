// components/Selections/SelectionManager.tsx
import React, { useState } from 'react';
import {
  useSelection,
  useSelectionBooks,
  useUpdateSelection,
  useDeleteSelection,
  useAddBookToSelection,
  useRemoveBookFromSelection,
} from '@/api/collections';
import styles from './SelectionManager.module.css';

interface SelectionManagerProps {
  selectionId: number;
  onBack: () => void;
  userId: number;
}

export const SelectionManager: React.FC<SelectionManagerProps> = ({
  selectionId,
  onBack,
  userId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [bookId, setBookId] = useState('');
  const [lastId, setLastId] = useState<number | null>(null);
  const limit = 10;

  const { data: selection, isLoading: selectionLoading } =
    useSelection(selectionId);
  const { data: books, isLoading: booksLoading } = useSelectionBooks(
    selectionId,
    lastId,
    limit
  );

  const updateMutation = useUpdateSelection();
  const deleteMutation = useDeleteSelection();
  const addBookMutation = useAddBookToSelection();
  const removeBookMutation = useRemoveBookFromSelection();

  const handleEdit = () => {
    if (selection) {
      setEditData({
        name: selection.name,
        description: selection.description,
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      selectionId,
      data: editData,
    });
    setIsEditing(false);
  };

  const handleToggleActive = () => {
    if (selection) {
      updateMutation.mutate({
        selectionId,
        data: { isActive: !selection.isActive },
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить подборку?')) {
      deleteMutation.mutate(selectionId);
      onBack();
    }
  };

  const handleAddBook = () => {
    const id = parseInt(bookId);
    if (!isNaN(id)) {
      addBookMutation.mutate({ selectionId, bookId: id });
      setBookId('');
    }
  };

  const handleRemoveBook = (bookId: number) => {
    removeBookMutation.mutate({ selectionId, bookId });
  };

  const handleLoadMore = () => {
    if (books?.items && books.items.length > 0) {
      setLastId(books.items[books.items.length - 1].id);
    }
  };

  if (selectionLoading)
    return <div className={styles['loading']}>Загрузка...</div>;
  if (!selection)
    return <div className={styles['error']}>Подборка не найдена</div>;

  return (
    <div className={styles['container']}>
      <button className={styles['back-button']} onClick={onBack}>
        ← Назад
      </button>

      <div className={styles['header']}>
        {isEditing ? (
          <div className={styles['edit-form']}>
            <input
              type="text"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
              className={styles['input']}
              placeholder="Название"
            />
            <textarea
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
              className={styles['textarea']}
              placeholder="Описание"
            />
            <div className={styles['buttons']}>
              <button onClick={handleSave} className={styles['save-button']}>
                Сохранить
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className={styles.cancelButton}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>{selection.name}</h1>
            <p className={styles.description}>{selection.description}</p>
            <div className={styles.status}>
              <span
                className={selection.isActive ? styles.active : styles.inactive}
              >
                {selection.isActive ? 'Активна' : 'Скрыта'}
              </span>
            </div>
            <div className={styles['actions']}>
              <button onClick={handleEdit} className={styles['action-button']}>
                Редактировать
              </button>
              <button
                onClick={handleToggleActive}
                className={styles['action-button']}
              >
                {selection.isActive ? 'Скрыть' : 'Показать'}
              </button>
              <button
                onClick={handleDelete}
                className={`${styles['action-button']} ${styles['delete-button']}`}
              >
                Удалить
              </button>
            </div>
          </>
        )}
      </div>

      <div className={styles['books-section']}>
        <h2 className={styles['section-title']}>Книги в подборке</h2>

        <div className={styles['add-book-form']}>
          <input
            type="number"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className={styles['input']}
            placeholder="ID книги"
          />
          <button onClick={handleAddBook} className={styles['add-button']}>
            Добавить
          </button>
        </div>

        {booksLoading ? (
          <div className={styles['loading']}>Загрузка книг...</div>
        ) : (
          <>
            <div className={styles['books-grid']}>
              {books?.items.map((book) => (
                <div key={book.id} className={styles['book-card']}>
                  {book.coverUri && (
                    <img
                      src={book.coverUri}
                      alt={book.title}
                      className={styles['book-cover']}
                    />
                  )}
                  <h4 className={styles['book-title']}>{book.title}</h4>
                  <p className={styles['book-authors']}>
                    {book.authors?.join(', ')}
                  </p>
                  <div className={styles['book-rating']}>
                    ★ {book.averageRating?.toFixed(1)} ({book.ratingsCount})
                  </div>
                  <button
                    onClick={() => handleRemoveBook(book.id)}
                    className={styles['remove-button']}
                  >
                    Удалить из подборки
                  </button>
                </div>
              ))}
            </div>

            {books?.hasNext && (
              <button
                onClick={handleLoadMore}
                className={styles.loadMoreButton}
              >
                Загрузить ещё
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
