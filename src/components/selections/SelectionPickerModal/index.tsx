import { SquareCheckBig, Square, X } from 'lucide-react';
import {
  useAddBookToSelection,
  useRemoveBookFromSelection,
  useSeekedSelections,
  useSelectionsInfinite,
} from '@/api/collections';
import styles from './index.module.css';
import { createPortal } from 'react-dom';

interface Props {
  bookId: number;
  onClose: () => void;
  onRefresh?: () => void;
}

export const SelectionPickerModal = ({ bookId, onClose, onRefresh }: Props) => {
  const { data: infiniteData } = useSelectionsInfinite(50, false); // false = все, не только активные
  const selections = infiniteData?.pages.flatMap((page) => page.items) ?? [];

  const { data: seekedSelections } = useSeekedSelections(bookId);

  const { mutateAsync: addBookToSelection } = useAddBookToSelection();
  const { mutateAsync: removeBookFromSelection } = useRemoveBookFromSelection();

  const handleToggle = async (selectionId: number) => {
    const isInSelection = seekedSelections?.includes(selectionId);
    if (isInSelection) {
      await removeBookFromSelection({ selectionId, bookId });
    } else {
      await addBookToSelection({ selectionId, bookId });
    }
    if (onRefresh) onRefresh();
  };

  return createPortal(
    <div className={styles['modal-overlay']}>
      <div className={styles['modal-content']}>
        <button className={styles['close-btn']} onClick={onClose}>
          <X />
        </button>
        <h3>Добавить в подборку</h3>
        {selections.length === 0 ? (
          <p className={styles['empty']}>Нет доступных подборок</p>
        ) : (
          <ul className={styles['list']}>
            {selections.map((selection) => (
              <li
                key={selection.id}
                onClick={() => handleToggle(selection.id)}
                className={styles['list-item']}
              >
                <span className={styles['selection-name']}>
                  {selection.name}
                </span>
                {seekedSelections?.includes(selection.id) ? (
                  <SquareCheckBig />
                ) : (
                  <Square />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
};
