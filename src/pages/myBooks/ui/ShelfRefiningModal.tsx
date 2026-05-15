import styles from './ShelfRefiningModal.module.css';
import { X } from 'lucide-react';
import { BookShelfConstructing } from './BookShelfConstructing';
// import { collectionsApi, useShelves } from '../../../api/collections';
// import { useStore } from '@/stores/globalStore';

interface ShelfRefiningModalProps {
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  initialName?: string;
  title?: string;
}

export const ShelfRefiningModal = ({
  onClose,
  onSubmit,
  initialName = '',
  title = '',
}: ShelfRefiningModalProps) => {
  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal-content']}>
        <button className={styles['close-btn']} onClick={onClose}>
          <X style={{ cursor: 'pointer' }} />
        </button>
        {title && <p>{title}</p>}
        <BookShelfConstructing
          handleCreate={onSubmit}
          initialValue={initialName}
        />
      </div>
    </div>
  );
};
