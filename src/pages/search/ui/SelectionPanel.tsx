import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  useAllSelections,
  // useSelectionsInfinite
} from '@/api/collections';
import styles from './SelectionPanel.module.css';
import type { SelectionDetails } from '@/types';

interface SelectionPanelProps {
  selectedSelectionId: number | null;
  onSelect: (selectionId: number | null) => void;
}

export function SelectionPanel({
  selectedSelectionId,
  onSelect,
}: SelectionPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: selections, isLoading } = useAllSelections();

  return (
    <aside
      className={`${styles.panel} ${collapsed ? styles['panel-collapsed'] : ''}`}
    >
      <div className={styles.header} onClick={() => setCollapsed((v) => !v)}>
        <span className={styles.title}>ПОДБОРКИ</span>
        <button
          className={styles['toggle-btn']}
          aria-label={collapsed ? 'Развернуть' : 'Свернуть'}
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((v) => !v);
          }}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
            </div>
          ) : (selections ?? []).length === 0 ? (
            <p className={styles.empty}>Нет подборок</p>
          ) : (
            <ul className={styles['selection-list']}>
              {(selections ?? []).map((sel: SelectionDetails) => {
                const isSelected = sel.id === selectedSelectionId;
                return (
                  <li
                    title={sel.name}
                    key={sel.id}
                    className={`${styles['selection-item']} ${isSelected ? styles['selection-item-selected'] : ''}`}
                    onClick={() => onSelect(isSelected ? null : sel.id)}
                  >
                    <span
                      style={{ overflowWrap: 'break-word' }}
                      className={styles['selection-name']}
                    >
                      {sel.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {selectedSelectionId !== null && (
            <button
              className={styles['clear-btn']}
              onClick={() => onSelect(null)}
            >
              Сбросить подборку
            </button>
          )}
        </>
      )}
    </aside>
  );
}
