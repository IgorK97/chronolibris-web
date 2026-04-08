import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSelection,
  useSelectionBooks,
  useUpdateSelection,
  useDeleteSelection,
  useAddBookToSelection,
  useRemoveBookFromSelection,
  useCreateSelection,
} from '@/api/collections';
import { BookCard } from '@/components/Books';
import type { BookListItem } from '@/types';
import styles from './SelectionManager.module.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface SelectionManagerEditProps {
  mode: 'edit';
  selectionId: number;
  onBack: () => void;
}

interface SelectionManagerCreateProps {
  mode: 'create';
  onBack: () => void;
  onCreate?: (selectionId: number) => void;
}

type SelectionManagerProps =
  | SelectionManagerEditProps
  | SelectionManagerCreateProps;

const BOOKS_LIMIT = 10;

function useInfiniteBooks(selectionId: number) {
  const [lastId, setLastId] = useState<number | null>(null);
  const [allBooks, setAllBooks] = useState<BookListItem[]>([]);

  const { data, isLoading, isFetching } = useSelectionBooks(
    selectionId,
    lastId,
    BOOKS_LIMIT
  );

  useEffect(() => {
    if (data?.items && data.items.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllBooks((prev) => {
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

interface CreateFormProps {
  onBack: () => void;
  onCreate?: (selectionId: number) => void;
}

const CreateForm: React.FC<CreateFormProps> = ({ onBack, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const createMutation = useCreateSelection();

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate(
      { name: formData.name, description: formData.description },
      {
        onSuccess: (newSelectionId) => {
          onCreate?.(newSelectionId);
        },
      }
    );
  };

  return (
    <div className={styles['container']}>
      <button onClick={onBack}>
        <ArrowLeft style={{ cursor: 'pointer' }} /> Назад
      </button>

      <div className={styles['header']}>
        <h1 className={styles['title']}>Новая подборка</h1>

        <div className={styles['edit-form']}>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={styles['input']}
            placeholder="Название"
          />
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className={styles['textarea']}
            placeholder="Описание"
          />

          <div className={styles['visibility-row']}>
            <label className={styles['checkbox-label']}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className={styles['checkbox']}
              />
              Активна
            </label>
          </div>

          <div className={styles['buttons']}>
            <button
              onClick={handleCreate}
              className={styles['btn']}
              disabled={!formData.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Создание…' : 'Создать подборку'}
            </button>
            <button
              onClick={onBack}
              className={`${styles['btn']} ${styles['btn-danger']}`}
            >
              Отмена
            </button>
          </div>

          {createMutation.isError && (
            <div className={styles['error']}>Ошибка при создании подборки</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SelectionManager: React.FC<SelectionManagerProps> = (props) => {
  if (props.mode === 'create') {
    return <CreateForm onBack={props.onBack} onCreate={props.onCreate} />;
  }

  return (
    <SelectionEditView selectionId={props.selectionId} onBack={props.onBack} />
  );
};

interface SelectionEditViewProps {
  selectionId: number;
  onBack: () => void;
}

const SelectionEditView: React.FC<SelectionEditViewProps> = ({
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
          queryClient.invalidateQueries({
            queryKey: ['selection', selectionId],
          });
        },
      }
    );
  };

  if (selectionLoading)
    return <div className={styles['loading']}>Загрузка...</div>;
  if (!selection)
    return <div className={styles['error']}>Подборка не найдена</div>;

  return (
    <div className={styles['container']}>
      <button onClick={onBack}>
        <ArrowLeft style={{ cursor: 'pointer' }} /> Назад
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
              <button onClick={handleSave} className={styles['btn']}>
                Сохранить
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className={`${styles['btn']} ${styles['btn-danger']}`}
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
              <button
                onClick={handleEdit}
                className={`${styles['btn']} ${styles['btn-update']}`}
              >
                Редактировать
              </button>
              <button
                onClick={handleToggleActive}
                className={`${styles['btn']} ${styles['btn-update']}`}
              >
                {selection.isActive ? 'Скрыть' : 'Показать'}
              </button>
              <button
                onClick={handleDelete}
                className={`${styles['btn']} ${styles['btn-danger']}`}
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
          <button
            onClick={handleAddBook}
            className={`${styles['btn']} ${styles['btn-update']}`}
          >
            Добавить
          </button>
        </div>

        {booksLoading && books.length === 0 ? (
          <div className={styles['loading']}>Загрузка книг...</div>
        ) : (
          <>
            <div className={styles['books-grid']}>
              {books.map((book) => (
                <div key={book.id} className={styles['book-card-wrapper']}>
                  <BookCard
                    bookInfo={book}
                    onPress={() => {
                      navigate(`/book/${book.id}`);
                    }}
                  />
                  <button
                    className={`${styles['btn']} ${styles['btn-danger']}`}
                    onClick={() => handleRemoveBook(book.id)}
                    disabled={removeBookMutation.isPending}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>

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
