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
  textColor?: string;
  pageColor?: string;
  bgColor?: string;
}

export const TocSidebar: React.FC<TocSidebarProps> = ({
  open,
  onClose,
  tocData,
  currentPartIndex,
  onSelectPart,
  textColor,
  pageColor,
  bgColor,
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
            <span className={styles['toc-item-text']}>
              {item?.t?.trim() || ''}
            </span>
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
        title="Содержание"
        role="navigation"
        style={{
          background: pageColor,
          color: textColor,
          borderColor: bgColor,
        }}
      >
        <div className={styles['toc-header']}>
          <span className={styles['toc-title']}>Содержание</span>
          <button
            className={styles['footnote-close']}
            onClick={onClose}
            title="Закрыть"
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles['toc-list']}>
          {tocData.Body &&
            tocData.Body.length > 0 &&
            renderBodyItems(tocData.Body)}
        </div>
      </aside>
    </>,
    document.body
  );
};
