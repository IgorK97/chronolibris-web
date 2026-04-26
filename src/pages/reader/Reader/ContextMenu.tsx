import type { Bookmark as BookmarkDetails } from '@/types';
import { Bookmark } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Reader.module.scss';

interface ContextMenuProps {
  x: number;
  y: number;
  paraIndex: number;
  existingBookmark: BookmarkDetails | null;
  onAddBookmark: (note: string) => void;
  onEditBookmark: (bm: BookmarkDetails) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  existingBookmark,
  onAddBookmark,
  onEditBookmark,
  onClose,
}) => {
  const [phase, setPhase] = useState<'menu' | 'add'>('menu');
  const [note, setNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (phase === 'add') setTimeout(() => textareaRef.current?.focus(), 30);
  }, [phase]);

  //Позиционирование — не вылезать за правый/нижний край
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 260),
    top: Math.min(y, window.innerHeight - 200),
    zIndex: 4000,
  };

  return createPortal(
    <div data-ctx-menu="true" className={styles['ctx-menu']} style={style}>
      {phase === 'menu' ? (
        <>
          {existingBookmark ? (
            <button
              className={styles['ctx-item']}
              onClick={() => {
                onEditBookmark(existingBookmark);
                onClose();
              }}
            >
              <Bookmark color="red" /> Редактировать закладку
            </button>
          ) : (
            <button
              className={styles['ctx-item']}
              onClick={() => setPhase('add')}
            >
              <Bookmark color="red" /> Добавить закладку
            </button>
          )}
          <button
            className={`${styles['ctx-item']} ${styles['ctx-item-cancel']}`}
            onClick={onClose}
          >
            Отмена
          </button>
        </>
      ) : (
        <div className={styles['ctx-add-form']}>
          <div className={styles['ctx-add-label']}>Заметка к закладке</div>
          <textarea
            ref={textareaRef}
            className={styles['ctx-add-textarea']}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Необязательно…"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                onAddBookmark(note.trim());
              }
              if (e.key === 'Escape') onClose();
            }}
          />
          <div className={styles['ctx-add-actions']}>
            <button className={styles['ctx-cancel-btn']} onClick={onClose}>
              Отмена
            </button>
            <button
              className={styles['ctx-confirm-btn']}
              onClick={() => onAddBookmark(note.trim())}
            >
              Добавить
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
