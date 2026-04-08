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
import { ShelfRefiningModal } from './ShelfRefiningModal';

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
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'rename'>('create');
  const [renameTarget, setRenameTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleCreateShelf = async (name: string) => {
    if (!name.trim()) return;
    await collectionsApi.createShelf(name.trim());
    await refetchShelves();
    setModalOpen(false);
  };

  const handleRenameShelf = async (newName: string) => {
    if (!renameTarget) return;
    if (!newName.trim() || newName === renameTarget.name) {
      setModalOpen(false);
      setRenameTarget(null);
      return;
    }
    await collectionsApi.updateShelf(renameTarget.id, newName.trim());
    await refetchShelves();
    setModalOpen(false);
    setRenameTarget(null);
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
              </div>

              <div className={styles['shelf-action-btn']}>
                <button
                  onClick={(e) => {
                    // e.stopPropagation();
                    // setShelfMenuId(shelf.id);
                    e.stopPropagation();
                    setShelfMenuId((prev) =>
                      prev === shelf.id ? null : shelf.id
                    );
                  }}
                >
                  <Menu style={{ cursor: 'pointer' }} size={16} />
                </button>
                {shelfMenuId === shelf.id && (
                  <div className={styles['shelf-popup']}>
                    <button
                      onClick={() => {
                        setModalMode('rename');
                        setRenameTarget({ id: shelf.id, name: shelf.name });
                        setModalOpen(true);
                        setShelfMenuId(null);
                      }}
                    >
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
            onClick={() => {
              setModalMode('create');
              setModalOpen(true);
            }}
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
      {modalOpen && (
        <ShelfRefiningModal
          onClose={() => {
            setModalOpen(false);
            setRenameTarget(null);
          }}
          onSubmit={
            modalMode === 'create' ? handleCreateShelf : handleRenameShelf
          }
          initialName={modalMode === 'rename' ? renameTarget?.name : ''}
          title={
            modalMode === 'create' ? 'Создать полку' : 'Редактировать полку'
          }
        />
      )}
    </div>
  );
};
