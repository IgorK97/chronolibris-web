import React, {
  useState,
  useEffect,
  useRef,
  // useCallback,
  useMemo,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSelection,
  // useSelectionBooks,
  useUpdateSelection,
  useDeleteSelection,
  useAddBookToSelection,
  useRemoveBookFromSelection,
  useCreateSelection,
  useInfiniteSelectionBooks,
} from '@/api/collections';
import { BookCard } from '@/components/Books';
import styles from './SelectionManager.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AlertDialog } from '@/components/dialogs/AlertDialog';
import { SelectionPickerModal } from '@/components/selections';

export const SelectionCreatePage: React.FC = () => {
  const navigate = useNavigate();
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
          // onCreate?.(newSelectionId);
          navigate(`/selections/${newSelectionId}`, { replace: true });
        },
      }
    );
  };

  return (
    <div className={styles['container']}>
      <button onClick={() => navigate('/selections')}>
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
          {/* <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className={styles['textarea']}
            placeholder="Описание"
          /> */}

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
              onClick={() => navigate('/selections')}
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

export const SelectionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const selectionId = Number(id);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [bookId, setBookId] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectionModalBookId, setSelectionModalBookId] = useState<
    number | null
  >(null);
  const { data: selection, isLoading: selectionLoading } =
    useSelection(selectionId);

  useEffect(() => {
    if (selection) {
      document.title = `${selection.name} — Управление подборкой`;
    }
  }, [selection]);

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: booksLoading,
  } = useInfiniteSelectionBooks(selectionId);

  const books = useMemo(
    () => infiniteData?.pages.flatMap((page) => page.items) ?? [],
    [infiniteData]
  );

  const updateMutation = useUpdateSelection();
  const deleteMutation = useDeleteSelection();
  const addBookMutation = useAddBookToSelection();
  const removeBookMutation = useRemoveBookFromSelection();

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '100px' }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const handleDelete = async () => {
    setDeleteModalOpen(false);
    await deleteMutation.mutate(selectionId, {
      onSuccess: () => {
        navigate('/selections', { replace: true });
      },
    });
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
          // removeFromList(bookId);
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
      <button onClick={() => navigate('/selections')}>
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
            {/* <textarea
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
              className={styles['textarea']}
              placeholder="Описание"
            /> */}
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
              {/* <button
                onClick={() => {
                  setDeleteModalOpen(true);
                }}
                className={`${styles['btn']} ${styles['btn-danger']}`}
              >
                Удалить
              </button> */}
            </div>
          </>
        )}
      </div>

      <AlertDialog
        description={`Это действие нельзя будет отменить`}
        open={deleteModalOpen}
        title={`Вы действительно хотите удалить эту подборку?`}
        handleAccept={async () => {
          await handleDelete();
        }}
        handleReject={() => {
          setDeleteModalOpen(false);
        }}
      />

      <div className={styles['books-section']}>
        <h2 className={styles['section-title']}>Книги в подборке</h2>

        <div className={styles['add-book-form']}>
          <input
            type="number"
            value={bookId}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const val = e.target.value;
              const sanitized = val.replace(/\D/g, '');
              if (sanitized === '0') return;
              setBookId(sanitized);
            }}
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
                    onSelectionToggle={(bookId) =>
                      setSelectionModalBookId(bookId)
                    }
                  />
                  <button
                    className={`${styles['btn']} ${styles['btn-danger']}`}
                    style={{ marginTop: 5 }}
                    onClick={() => handleRemoveBook(book.id)}
                    disabled={removeBookMutation.isPending}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>

            <div
              ref={sentinelRef}
              style={{ height: 20, background: 'transparent' }}
            />

            {isFetchingNextPage && books.length > 0 && (
              <div className={styles['loading']}>Загрузка книг...</div>
            )}
          </>
        )}
      </div>
      {selectionModalBookId !== null && (
        <SelectionPickerModal
          bookId={selectionModalBookId}
          onClose={() => setSelectionModalBookId(null)}
        />
      )}
    </div>
  );
};
