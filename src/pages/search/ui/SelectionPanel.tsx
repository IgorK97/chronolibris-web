import { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useAllSelection } from '@/api/collections';
import styles from './SelectionPanel.module.css';

interface SelectionPanelProps {
  selectedSelectionId: number | null;
  onSelect: (selectionId: number | null) => void;
}

export function SelectionPanel({
  selectedSelectionId,
  onSelect,
}: SelectionPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: selections, isLoading } = useAllSelection();

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
              {(selections ?? []).map((sel) => {
                const isSelected = sel.id === selectedSelectionId;
                return (
                  <li
                    key={sel.id}
                    className={`${styles['selection-item']} ${isSelected ? styles['selection-item-selected'] : ''}`}
                    onClick={() => onSelect(isSelected ? null : sel.id)}
                  >
                    <span className={styles['selection-name']}>{sel.name}</span>
                    {isSelected && (
                      <button
                        className={styles['deselect-btn']}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(null);
                        }}
                        aria-label="Снять выбор"
                      >
                        <X size={12} />
                      </button>
                    )}
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
