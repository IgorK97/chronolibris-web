import {
  // useEffect,
  // React,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { LibraryBig, Plus, Menu, Edit3, Trash2 } from 'lucide-react';
import { useStore } from '../../../stores/globalStore';
import { useShelves, collectionsApi } from '../../../api/collections';
import { BookListByCategory } from './BookListByCategory';
import styles from './MyBooks.module.css';

export const MyBooks = ({
  onNavigateToBook,
}: {
  onNavigateToBook: (id: number) => void;
}) => {
  const { t } = useTranslation();
  const { user } = useStore();
  const {
    data: shelves,
    isLoading,
    refetch: refetchShelves,
  } = useShelves(user?.userId || 0);
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null);
  const [shelfMenuId, setShelfMenuId] = useState<number | null>(null);
  const activeShelfId = selectedShelfId ?? shelves?.[0]?.id;
  const handleRename = async (id: number, currentName: string) => {
    const name = prompt('Новое название:', currentName);
    if (name && name !== currentName) {
      await collectionsApi.updateShelf(id, name);
      refetchShelves();
    }
    setShelfMenuId(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить полку?')) {
      await collectionsApi.deleteShelf(id);
      refetchShelves();
      setSelectedShelfId(null);
    }
    setShelfMenuId(null);
  };

  if (activeShelfId === null || isLoading) return <div>Загрузка...</div>;
  return (
    <div className={styles['layout']}>
      <aside className={styles['sidebar']}>
        <div className={styles['sidebar-header']}>
          <LibraryBig size={20} /> {t('mybooks.my_books')}
        </div>

        <nav className={styles['shelf-list']}>
          {shelves?.map((shelf) => (
            <div
              key={shelf.id}
              className={`${styles['shelf-item']} ${activeShelfId === shelf.id ? styles.active : ''}`}
              onClick={() => setSelectedShelfId(shelf.id)}
            >
              <div className={styles['shelf-main']}>
                <span className={styles['shelf-name']}>{shelf.name}</span>
                {/* <span className={styles.count}>{shelf.bookCount || 0}</span> */}
              </div>

              <div className={styles['shelf-action-btn']}>
                <button
                  onClick={(e) => {
                    // e.stopPropagation();
                    // setShelfMenuId(shelf.id);
                    e.stopPropagation();
                    // Если меню этой полки уже открыто — закрываем (null), иначе открываем
                    setShelfMenuId((prev) =>
                      prev === shelf.id ? null : shelf.id
                    );
                  }}
                >
                  <Menu size={16} />
                </button>
                {shelfMenuId === shelf.id && (
                  <div className={styles['shelf-popup']}>
                    <button onClick={() => handleRename(shelf.id, shelf.name)}>
                      <Edit3 size={14} /> Переименовать
                    </button>
                    {shelf.shelfType === 3 && (
                      <button
                        onClick={() => handleDelete(shelf.id)}
                        className={styles['danger']}
                      >
                        <Trash2 size={14} /> Удалить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            className={styles['add-shelf-btn']}
            onClick={() => handleRename(0, '')}
          >
            <Plus size={18} /> Добавить полку
          </button>
        </nav>
      </aside>

      <main className={styles['main-content']}>
        {activeShelfId && (
          <BookListByCategory
            shelfId={activeShelfId}
            onNavigateToBook={onNavigateToBook}
          />
        )}
      </main>
    </div>
  );
};
