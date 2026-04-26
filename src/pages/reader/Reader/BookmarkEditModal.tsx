/* eslint-disable react-hooks/exhaustive-deps */
import type { Bookmark as BookmarkDetails } from '@/types';
import { formatDate } from '@/utils';
import { Bookmark, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Reader.module.css';

interface BookmarkEditModalProps {
  bookmark: BookmarkDetails;
  onSave: (note?: string) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

export const BookmarkEditModal: React.FC<BookmarkEditModalProps> = ({
  bookmark,
  onSave,
  onDelete,
  onClose,
}) => {
  const [note, setNote] = useState(bookmark.note);
  useEffect(() => setNote(bookmark.note), [bookmark.id]);

  return createPortal(
    <div className={styles['footnote-overlay']} onClick={onClose}>
      <div
        className={styles['bm-edit-modal']}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles['bm-edit-header']}>
          <span className={styles['bm-edit-title']}>
            <Bookmark color="red" /> Закладка
          </span>
          <button style={{ cursor: 'pointer' }} onClick={onClose}>
            <X />
          </button>
        </div>

        <div className={styles['bm-edit-position']}>
          {bookmark.context} {formatDate(bookmark.createdAt)}
        </div>

        <div className={styles['bm-edit-section']}>
          <span className={styles['bm-edit-label']}>Заметка</span>
          <textarea
            className={styles['bm-edit-textarea']}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Добавьте заметку…"
            rows={4}
            autoFocus
          />
        </div>

        <div className={styles['bm-edit-actions']}>
          <button
            className={styles['bm-delete-btn']}
            onClick={() => onDelete(bookmark.id)}
          >
            Удалить
          </button>
          <button
            className={styles['bm-save-btn']}
            onClick={() => {
              onSave(note?.trim());
              onClose();
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
