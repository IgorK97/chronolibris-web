// File: src/components/BookSearchPopup.tsx
import React, { useState } from 'react';
import { useBooks } from '@/api/books';
import type { BookDto, BookFilterRequest } from '@/types/types';
import styles from './BookSearchPopup.module.css';

interface BookSearchPopupProps {
  onClose: () => void;
  onSelectBook: (book: BookDto) => void;
  currentContentId: number;
}

export const BookSearchPopup: React.FC<BookSearchPopupProps> = ({
  onClose,
  onSelectBook,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentContentId,
}) => {
  const [filter, setFilter] = useState<BookFilterRequest>({
    searchQuery: '',
    limit: 20,
  });

  const { data: books, isLoading } = useBooks(filter);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, searchQuery: e.target.value });
  };

  const handleNextPage = () => {
    if (books?.nextCursor) {
      setFilter({ ...filter, cursor: books.nextCursor });
    }
  };

  const handlePrevPage = () => {
    if (books?.prevCursor) {
      setFilter({ ...filter, cursor: books.prevCursor });
    }
  };

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal-content book-search-popup']}>
        <div className={styles['modal-header']}>
          <h3>Поиск книг для добавления</h3>
          <button onClick={onClose} className={styles['btn-close']}>
            ✕
          </button>
        </div>

        <div className={styles['modal-body']}>
          <div className={styles['search-bar']}>
            <input
              type="text"
              value={filter.searchQuery || ''}
              onChange={handleSearch}
              placeholder="Поиск по названию..."
              className={styles['input-field']}
            />
          </div>

          {isLoading ? (
            <div className={styles['loading']}>Загрузка...</div>
          ) : (
            <table className={styles['books-table']}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>ISBN</th>
                  <th>Год</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {books?.items.map((book) => (
                  <tr key={book.id}>
                    <td>{book.id}</td>
                    <td>{book.title}</td>
                    <td>{book.isbn || '—'}</td>
                    <td>{book.year || '—'}</td>
                    <td>
                      <button
                        onClick={() => onSelectBook(book)}
                        className={styles['btn btn-success btn-sm']}
                      >
                        Выбрать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className={styles['pagination']}>
            <button
              onClick={handlePrevPage}
              disabled={!books?.prevCursor}
              className={styles['btn btn-secondary']}
            >
              ← Назад
            </button>
            <span>
              {books?.items.length} из {books?.totalCount}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!books?.hasMore}
              className={styles['btn btn-secondary']}
            >
              Вперед →
            </button>
          </div>
        </div>

        <div className={styles['modal-footer']}>
          <button onClick={onClose} className={styles['btn btn-secondary']}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
