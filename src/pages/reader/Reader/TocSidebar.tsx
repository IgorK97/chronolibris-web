/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TocBodyItem, TocData } from '@/types';
import styles from './Reader.module.css';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
interface TocSidebarProps {
  open: boolean;
  onClose: () => void;
  tocData: TocData | null;
  currentPartIndex: number;
  onSelectPart: (idx: number, xpointer?: number[]) => void;
}

export const TocSidebar: React.FC<TocSidebarProps> = ({
  open,
  onClose,
  tocData,
  currentPartIndex,
  onSelectPart,
}) => {
  if (!tocData) return null;

  const renderBodyItems = (
    items: TocBodyItem[],
    depth = 0
  ): React.ReactNode => {
    return items.map((item, i) => {
      const children = item.c || (item as any).C;

      const partIdx = tocData.Parts.findIndex(
        (p) => item.s >= p.s && item.s <= p.e
      );

      const isActive = partIdx === currentPartIndex;

      return (
        <div key={`${depth}-${i}`} className={styles['toc-item-container']}>
          <button
            className={`${styles['toc-item']} ${isActive ? styles['toc-item-active'] : ''}`}
            style={{
              paddingLeft: `${16 + depth * 12}px`,
              fontSize: depth === 0 ? '1rem' : '0.9rem',
              fontWeight: depth === 0 ? '600' : '400',
            }}
            onClick={() => {
              if (partIdx !== -1) {
                onSelectPart(partIdx, item.xps);
              }
            }}
          >
            <span className={styles['toc-item-text']}>{item.t.trim()}</span>
          </button>

          {children && children.length > 0 && (
            <div className={styles['toc-child-group']}>
              {renderBodyItems(children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return createPortal(
    <>
      <div
        className={`${styles['toc-overlay']} ${open ? styles['toc-overlay-open'] : ''}`}
        onClick={onClose}
      />
      <aside
        className={`${styles['toc-sidebar']} ${open ? styles['toc-sidebar-open'] : ''}`}
        aria-label="Содержание"
        role="navigation"
      >
        <div className={styles['toc-header']}>
          <span className={styles['toc-title']}>Содержание</span>
          <button
            className={styles['footnote-close']}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={24} />
          </button>
        </div>

        {/* {tocData.Meta?.Title && (
          <div className={styles['toc-book-title']}>{tocData.Meta.Title}</div>
        )} */}

        <div className={styles['toc-list']}>
          {
            tocData.Body &&
              tocData.Body.length > 0 &&
              renderBodyItems(tocData.Body)
            // : tocData.Parts.map((part, idx) => (
            //     <button
            //       key={idx}
            //       className={`${styles['toc-item']} ${idx === currentPartIndex ? styles['toc-item-active'] : ''}`}
            //       style={{ paddingLeft: 16 }}
            //       onClick={() => onSelectPart(idx)}
            //     >
            //       {part.url || `Часть ${idx + 1}`}
            //     </button>
            //   ))
          }
        </div>
      </aside>
    </>,
    document.body
  );
};
