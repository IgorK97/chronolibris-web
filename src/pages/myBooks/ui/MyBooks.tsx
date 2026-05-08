import {
  // useEffect,
  // React,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  LibraryBig,
  Plus,
  Menu,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useStore } from '../../../stores/globalStore';
import {
  useShelves,
  useCreateShelf,
  useUpdateShelf,
  useDeleteShelf,
} from '../../../api/collections';
import { BookListByCategory } from './BookListByCategory';
import styles from './MyBooks.module.css';
import { ShelfRefiningModal } from './ShelfRefiningModal';
import { createPortal } from 'react-dom';
import { AlertDialog } from '@/components/dialogs/AlertDialog';

export const MyBooks = ({
  onNavigateToBook,
}: {
  onNavigateToBook: (id: number) => void;
}) => {
  const { t } = useTranslation();
  const { user, isReader } = useStore();
  const { data: shelves, isLoading } = useShelves(
    user?.userName || '',
    isReader()
  );
  const { mutateAsync: createShelf } = useCreateShelf();
  const { mutateAsync: updateShelf } = useUpdateShelf();
  const { mutateAsync: deleteShelf } = useDeleteShelf();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingShelfId, setDeletingShelfId] = useState<number>(0);
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null);
  const [shelfMenuId, setShelfMenuId] = useState<number | null>(null);
  const activeShelfId = selectedShelfId ?? shelves?.[0]?.id;
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'rename'>('create');
  const [renameTarget, setRenameTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleCreateShelf = async (name: string) => {
    if (!name.trim()) return;
    await createShelf(name.trim());
    // await collectionsApi.createShelf(name.trim());
    // await refetchShelves();
    setModalOpen(false);
  };

  const handleRenameShelf = async (newName: string) => {
    if (!renameTarget) return;
    if (!newName.trim() || newName === renameTarget.name) {
      setModalOpen(false);
      setRenameTarget(null);
      return;
    }
    await updateShelf({ id: renameTarget.id, name: newName.trim() });
    setModalOpen(false);
    setRenameTarget(null);
    setShelfMenuId(null);
  };

  if (activeShelfId === null || isLoading) return <div>Загрузка...</div>;
  return (
    <div
      className={styles['layout']}
      // style={{ maxHeight: '85vh' }}
    >
      <aside
        style={{
          maxHeight: '100%',
          // overflowY: `${isCollapsed ? 'hidden' : 'auto'}`,
          // overflowY: 'auto',
          // overflowX: 'hidden',
        }}
      >
        <div
          style={{ cursor: 'pointer', paddingLeft: '5px' }}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <Eye size={20} /> : <EyeOff size={20} />}
        </div>
        <div
          className={`${styles['sidebar']} ${isCollapsed ? styles['collapsed'] : ''}`}
        >
          {/* <div> */}
          {/* {isCollapsed && <p>Развернуть</p>} */}
          <div className={styles['sidebar-header']} aria-label="Книжные полки">
            <LibraryBig size={20} /> {!isCollapsed ? t('mybooks.my_books') : ''}
          </div>
          {/* </div> */}
          <nav
            className={styles['shelf-list']}
            style={{
              overflowY: `${isCollapsed ? 'hidden' : 'auto'}`,
            }}
          >
            {shelves?.map((shelf) => (
              <div
                key={shelf.id}
                className={`${styles['shelf-item']} ${activeShelfId === shelf.id ? styles.active : ''}`}
                onClick={() => !isCollapsed && setSelectedShelfId(shelf.id)}
              >
                <div className={styles['shelf-main']}>
                  <span className={styles['shelf-name']}>{shelf.name}</span>
                </div>
                {!isCollapsed && (
                  <div className={styles['shelf-action-btn']}>
                    <button
                      onClick={(e) => {
                        // e.stopPropagation();
                        // setShelfMenuId(shelf.id);
                        e.stopPropagation();
                        setShelfMenuId((prev) =>
                          // prev === shelf.id ? null : shelf.id
                          {
                            if (
                              prev === shelf.id ||
                              shelf.shelfType == 1 ||
                              shelf.shelfType == 2
                            )
                              return null;
                            return shelf.id;
                          }
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
                            onClick={() => {
                              setDeletingShelfId(shelf.id);
                              setDeleteModalOpen(true);
                            }}
                            className={styles['danger']}
                          >
                            <Trash2 size={14} /> Удалить
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>
          {!isCollapsed && (
            <button
              className={styles['add-shelf-btn']}
              onClick={() => {
                setModalMode('create');
                setModalOpen(true);
              }}
            >
              <Plus style={{ cursor: 'pointer' }} size={18} /> Добавить полку
            </button>
          )}
        </div>
      </aside>

      <main className={styles['main-content']}>
        {activeShelfId && (
          <BookListByCategory
            shelfId={activeShelfId}
            onNavigateToBook={onNavigateToBook}
          />
        )}
      </main>
      <AlertDialog
        description={`Действие удалит книжную полку вместе со всем ее содержимым.
                   Это действие нельзя будет отменить`}
        open={deleteModalOpen}
        title={`Вы действительно хотите удалить эту книжную полку?`}
        handleAccept={async () => {
          setSelectedShelfId(null);
          setShelfMenuId(null);
          setDeleteModalOpen(false);
          await deleteShelf(deletingShelfId);
          setDeletingShelfId(0);
        }}
        handleReject={() => {
          setDeleteModalOpen(false);
          setDeletingShelfId(0);
          setShelfMenuId(null);
        }}
      />
      {modalOpen &&
        createPortal(
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
          />,
          document.body
        )}
    </div>
  );
};
