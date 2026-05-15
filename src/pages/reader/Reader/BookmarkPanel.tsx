import type { Bookmark as BookmarkDetails } from '@/types';
import { formatDate } from '@/utils';
import { Bookmark, PencilLine, Trash2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import styles from './Reader.module.css';

interface BookmarkPanelProps {
  open: boolean;
  onClose: () => void;
  bookmarks: BookmarkDetails[];
  isLoading?: boolean;
  onEdit: (bm: BookmarkDetails) => void;
  onDelete: (id: number) => void;
  onNavigate: (bm: BookmarkDetails) => void;
  textColor?: string;
  pageColor?: string;
  bgColor?: string;
}

//из "/1/3/7" в [1,3,7]
const parseXpointer = (xp: string): number[] =>
  xp
    .split('/')
    .filter((s) => !!s)
    .map((s) => Number(s));

const compareXp = (a: number[], b: number[]): number => {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; //по возрастанию, первым идет а, потом б
  }
  return a.length - b.length;
};

export const BookmarkPanel: React.FC<BookmarkPanelProps> = ({
  open,
  onClose,
  bookmarks,
  isLoading,
  onEdit,
  onDelete,
  onNavigate,
  textColor,
  pageColor,
  bgColor,
}) =>
  createPortal(
    <>
      <div
        className={`${styles['toc-overlay']} ${open ? styles['toc-overlay-open'] : ''}`}
        onClick={onClose}
        data-testid="panel-overlay"
      />
      <div
        className={`${styles['toc-sidebar']} ${styles['bm-sidebar']} ${open ? styles['toc-sidebar-open'] : ''}`}
        title="Закладки"
        style={{
          background: pageColor,
          color: textColor,
          borderColor: bgColor,
        }}
      >
        <div className={styles['toc-header']}>
          <span
          // style={{ color: textColor }}
          // className={styles['toc-title']}
          >
            Закладки ({bookmarks.length})
          </span>
          <button
            className={styles['footnote-close']}
            onClick={onClose}
            title="Закрыть"
          >
            <X style={{ cursor: 'pointer' }} />
          </button>
        </div>

        {bookmarks.length === 0 ? (
          isLoading ? (
            <div className={styles['bm-empty']}>Загрузка закладок...</div>
          ) : (
            <div className={styles['bm-empty']}>
              Правый клик на абзаце,
              <br />
              чтобы поставить закладку
            </div>
          )
        ) : (
          <div className={styles['toc-list']}>
            {[...bookmarks]
              .sort((a, b) =>
                compareXp(parseXpointer(a.xpointer), parseXpointer(b.xpointer))
              )
              .map((bm) => (
                <div key={bm.id} className={styles['bm-item']}>
                  <div className={styles['bm-item-icon']}>
                    <Bookmark color="red" />
                  </div>
                  <div className={styles['bm-item-body']}>
                    <div
                      className={styles['bm-item-title']}
                      onClick={() => onNavigate(bm)}
                      title="Перейти к закладке"
                    >
                      {bm.context ? `«${bm.context}»` : bm.xpointer}
                    </div>
                    {bm.note && (
                      <div className={styles['bm-item-note']}>{bm.note}</div>
                    )}
                    <div className={styles['bm-item-meta']}>
                      {formatDate(bm.createdAt)}
                    </div>
                    <div className={styles['bm-item-actions']}>
                      <button
                        className={styles['bm-item-btn']}
                        onClick={() => onEdit(bm)}
                      >
                        <PencilLine /> Изменить
                      </button>
                      <button
                        className={styles['bm-item-btn']}
                        onClick={() => onDelete(bm.id)}
                      >
                        <Trash2 /> Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </>,
    document.body
  );
