// components/Selections/SelectionManager.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSelection,
  useSelectionBooks,
  useUpdateSelection,
  useDeleteSelection,
  useAddBookToSelection,
  useRemoveBookFromSelection,
} from '@/api/collections';
import { BookCard } from '@/components/books';
import type { BookListItem } from '@/types/types';
import styles from './SelectionManager.module.css';
import { useNavigate } from 'react-router-dom';

interface SelectionManagerProps {
  selectionId: number;
  onBack: () => void;
}

// ─── Хук для накопительного списка книг с keyset-пагинацией ──────────────────
//
// useSelectionBooks возвращает одну страницу. Чтобы реализовать
// infinite scroll без useInfiniteQuery, накапливаем книги вручную:
// при каждом изменении lastId добавляем новую порцию к уже загруженным.

const BOOKS_LIMIT = 10;

function useInfiniteBooks(selectionId: number) {
  const [lastId, setLastId] = useState<number | null>(null);
  const [allBooks, setAllBooks] = useState<BookListItem[]>([]);

  const { data, isLoading, isFetching } = useSelectionBooks(
    selectionId,
    lastId,
    BOOKS_LIMIT
  );

  // Добавляем новую порцию к накопленному списку
  useEffect(() => {
    if (data?.items && data.items.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllBooks((prev) => {
        // Защита от дублей при повторном рендере
        const existingIds = new Set(prev.map((b) => b.id));
        const fresh = data.items.filter((b) => !existingIds.has(b.id));
        return fresh.length > 0 ? [...prev, ...fresh] : prev;
      });
    }
  }, [data]);

  const loadMore = useCallback(() => {
    if (data?.hasNext && data.items.length > 0) {
      setLastId(data.items[data.items.length - 1].id);
    }
  }, [data]);

  // Удаление книги из локального списка (оптимистично, без перезагрузки)
  const removeFromList = useCallback((bookId: number) => {
    setAllBooks((prev) => prev.filter((b) => b.id !== bookId));
  }, []);

  return {
    books: allBooks,
    hasMore: data?.hasNext ?? false,
    isLoading,
    isFetching,
    loadMore,
    removeFromList,
  };
}

// ─── SelectionManager ─────────────────────────────────────────────────────────

export const SelectionManager: React.FC<SelectionManagerProps> = ({
  selectionId,
  onBack,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [bookId, setBookId] = useState('');

  const { data: selection, isLoading: selectionLoading } =
    useSelection(selectionId);

  const {
    books,
    hasMore,
    isLoading: booksLoading,
    isFetching,
    loadMore,
    removeFromList,
  } = useInfiniteBooks(selectionId);

  const updateMutation = useUpdateSelection();
  const deleteMutation = useDeleteSelection();
  const addBookMutation = useAddBookToSelection();
  const removeBookMutation = useRemoveBookFromSelection();

  // ─── Sentinel для infinite scroll книг ──────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isFetching) {
        loadMore();
      }
    },
    [hasMore, isFetching, loadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '150px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersection]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleEdit = () => {
    if (selection) {
      setEditData({ name: selection.name, description: selection.description });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ selectionId, data: editData });
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

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleRemoveBook = (bookId: number) => {
    removeBookMutation.mutate(
      { selectionId, bookId },
      {
        onSuccess: () => {
          removeFromList(bookId);
          // Обновляем данные подборки, чтобы booksCount пересчитался
          queryClient.invalidateQueries({
            queryKey: ['selection', selectionId],
          });
        },
      }
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (selectionLoading)
    return <div className={styles['loading']}>Загрузка...</div>;
  if (!selection)
    return <div className={styles['error']}>Подборка не найдена</div>;

  return (
    <div className={styles['container']}>
      <button className={styles['back-button']} onClick={onBack}>
        ← Назад
      </button>

      {/* ── Шапка подборки ─────────────────────────────────────────────── */}
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
                className={styles['cancelButton']}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className={styles['title']}>{selection.name}</h1>
            <p className={styles['description']}>{selection.description}</p>
            <div className={styles['status']}>
              <span
                className={
                  selection.isActive ? styles['active'] : styles['inactive']
                }
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

      {/* ── Книги ──────────────────────────────────────────────────────── */}
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

        {booksLoading && books.length === 0 ? (
          <div className={styles['loading']}>Загрузка книг...</div>
        ) : (
          <>
            <div className={styles['books-grid']}>
              {books.map((book) => (
                // Оборачиваем BookCard в позиционированный div,
                // чтобы добавить кнопку снизу без нового компонента
                <div key={book.id} className={styles['book-card-wrapper']}>
                  <BookCard
                    bookInfo={book}
                    onPress={() => {
                      navigate(`/book/${book.id}`);
                    }}
                  />
                  <button
                    className={styles['remove-book-button']}
                    onClick={() => handleRemoveBook(book.id)}
                    disabled={removeBookMutation.isPending}
                  >
                    Удалить из подборки
                  </button>
                </div>
              ))}
            </div>

            {/* Sentinel для infinite scroll книг */}
            <div ref={sentinelRef} style={{ height: 1 }} />

            {isFetching && books.length > 0 && (
              <div className={styles['loading']}>Загрузка книг...</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
