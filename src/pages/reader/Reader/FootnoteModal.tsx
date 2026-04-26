import type { Note } from '@/types';
import { createPortal } from 'react-dom';
import styles from './Reader.module.css';
import { X } from 'lucide-react';
interface FootnoteModalProps {
  note: Note | null;
  onClose: () => void;
  textColor: string;
  pageColor: string;
  fontFamily: string;
}

export const FootnoteModal: React.FC<FootnoteModalProps> = ({
  note,
  onClose,
  textColor,
  pageColor,
  fontFamily,
}) => {
  if (!note) return null;
  const footnoteText = note.f
    ? Array.isArray(note.f.c)
      ? note.f.c.join('\n\n')
      : note.f.c
    : '';
  return createPortal(
    <div className={styles['footnote-overlay']} onClick={onClose}>
      <div
        className={styles['footnote-modal']}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ background: pageColor, color: textColor, fontFamily }}
      >
        <button
          className={styles['footnote-close']}
          onClick={onClose}
          aria-label="Закрыть"
          style={{ color: textColor }}
        >
          <X />
        </button>
        <div className={styles['footnote-content']}>
          <span
            className={styles['footnote-label']}
            style={{ color: textColor }}
          >
            {note.c}
          </span>
          <p style={{ color: textColor }}>{footnoteText}</p>
        </div>
      </div>
    </div>,
    document.body
  );
};
