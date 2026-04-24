import { useState } from 'react';
import { SquareCheckBig, Square, X } from 'lucide-react';
import {
  // collectionsApi,
  useAddBookToShelf,
  useCreateShelf,
  useRemoveBookFromShelf,
  useSeekedShelves,
  useShelves,
} from '@api/collections';
import { useStore } from '@stores/globalStore';
import styles from './ShelfSelectionModal.module.css';
import { BookShelfConstructing } from './BookShelfConstructing';

interface Props {
  bookId: number;
  onClose: () => void;
  onRefresh?: () => void;
}

export const ShelfSelectionModal = ({ bookId, onClose, onRefresh }: Props) => {
  const { user, isReader } = useStore();
  const { data: shelves, refetch: refetchShelves } = useShelves(
    user?.userName || '',
    isReader()
  );
  const { data: seekedShelves } = useSeekedShelves(bookId);
  const [isCreating, setIsCreating] = useState(false);

  const { mutateAsync: createShelf } = useCreateShelf();
  const { mutateAsync: addBookToShelf } = useAddBookToShelf();
  const { mutateAsync: removeBookFromShelf } = useRemoveBookFromShelf();
  // const [newName, setNewName] = useState('');

  const handleToggle = async (shelfId: number) => {
    const isOnShelf = seekedShelves?.includes(shelfId);
    // console.log(isOnShelf, 'TUTA TUTA');
    if (isOnShelf) await removeBookFromShelf({ shelfId, bookId });
    else await addBookToShelf({ shelfId, bookId });

    // refetchSeeked();
    if (onRefresh) onRefresh();
  };

  const handleCreate = async (newName: string) => {
    if (!newName.trim()) return;
    const id = await createShelf(newName.trim());
    if (id) {
      refetchShelves();
      // setNewName('');
      setIsCreating(false);
    }
  };

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal-content']}>
        <button className={styles['close-btn']} onClick={onClose}>
          <X />
        </button>
        <h3>Добавить на книжные полки</h3>
        <ul className={styles['list']}>
          {shelves?.map((shelf) => (
            <li key={shelf.id} onClick={() => handleToggle(shelf.id)}>
              <span>{shelf.name}</span>
              {seekedShelves?.includes(shelf.id) ? (
                <SquareCheckBig />
              ) : (
                <Square />
              )}
            </li>
          ))}
        </ul>
        {isCreating ? (
          <BookShelfConstructing handleCreate={handleCreate} />
        ) : (
          <button
            className={styles['add-btn']}
            onClick={() => setIsCreating(true)}
          >
            + Создать полку
          </button>
        )}
      </div>
    </div>
  );
};
