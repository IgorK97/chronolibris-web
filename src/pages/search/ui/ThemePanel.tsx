import { useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { useThemes, useThemesByParentId, useThemeById } from '@/api/themes';
import type { ThemeDto } from '@/types/types';
import styles from './ThemePanel.module.css';

interface ThemePanelProps {
  selectedThemeId: number | null;
  onSelect: (themeId: number | null) => void;
}

interface ThemeLevelProps {
  themes: ThemeDto[];
  selectedThemeId: number | null;
  pendingThemeId: number | null;
  onPendingSelect: (id: number | null) => void;
  onDrillDown: (id: number) => void;
}

function ThemeLevel({
  themes,
  selectedThemeId,
  pendingThemeId,
  onPendingSelect,
  onDrillDown,
}: ThemeLevelProps) {
  return (
    <ul className={styles['theme-list']}>
      {themes.map((theme) => {
        const isSelected = theme.id === selectedThemeId;
        const isPending = theme.id === pendingThemeId;
        return (
          <li
            key={theme.id}
            className={`${styles['theme-item']} ${isSelected ? styles['theme-item-selected'] : ''} ${isPending ? styles['theme-item-pending'] : ''}`}
          >
            <span
              className={styles['theme-name']}
              onClick={() =>
                onPendingSelect(isPending && !isSelected ? null : theme.id)
              }
            >
              {theme.name}
            </span>
            <button
              className={styles['drill-btn']}
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown(theme.id);
              }}
              title="Показать подтемы"
              aria-label="Показать подтемы"
            >
              <ChevronDown size={14} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ThemePanel({ selectedThemeId, onSelect }: ThemePanelProps) {
  // Stack of theme IDs we've drilled into (navigation history)
  const [stack, setStack] = useState<number[]>([]);

  // Current "pending" selection (highlighted but not yet applied)
  const [pendingId, setPendingId] = useState<number | null>(selectedThemeId);

  // Current parent level: last item in stack, or null for root
  const currentParentId = stack.length > 0 ? stack[stack.length - 1] : null;

  const rootThemes = useThemes();
  const childThemes = useThemesByParentId(currentParentId);
  const currentParentTheme = useThemeById(currentParentId);

  const themes =
    currentParentId === null
      ? (rootThemes.data ?? [])
      : (childThemes.data ?? []);

  const isLoading =
    currentParentId === null ? rootThemes.isLoading : childThemes.isLoading;

  const handleDrillDown = (id: number) => {
    setPendingId(id);
    setStack((prev) => [...prev, id]);
  };

  const handleBack = () => {
    // Remove last item from stack — we go up one level
    // The theme that was "current parent" becomes just an item in the list
    setStack((prev) => prev.slice(0, -1));
    // Keep pending as the item we're returning from (so it stays highlighted but unselected state)
    setPendingId(currentParentId);
  };

  const handleApply = () => {
    onSelect(pendingId);
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Темы</span>
        {pendingId !== null && (
          <button className={styles['apply-btn']} onClick={handleApply}>
            Перейти
          </button>
        )}
      </div>

      {stack.length > 0 && (
        <button className={styles['back-btn']} onClick={handleBack}>
          <ChevronLeft size={14} />
          Назад
        </button>
      )}

      {/* Show current parent theme highlighted above the children */}
      {currentParentId !== null && currentParentTheme.data && (
        <div
          className={`${styles['current-parent']} ${
            pendingId === currentParentId ? styles['theme-item-pending'] : ''
          } ${selectedThemeId === currentParentId ? styles['theme-item-selected'] : ''}`}
          onClick={() =>
            setPendingId(
              pendingId === currentParentId &&
                selectedThemeId !== currentParentId
                ? null
                : currentParentId
            )
          }
        >
          <span className={styles['current-parent-name']}>
            {currentParentTheme.data.name}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      ) : themes.length === 0 ? (
        <p className={styles.empty}>Нет подтем</p>
      ) : (
        <ThemeLevel
          themes={themes}
          selectedThemeId={selectedThemeId}
          pendingThemeId={pendingId}
          onPendingSelect={setPendingId}
          onDrillDown={handleDrillDown}
        />
      )}

      {selectedThemeId !== null && (
        <button
          className={styles['clear-btn']}
          onClick={() => {
            onSelect(null);
            setPendingId(null);
          }}
        >
          Сбросить тему
        </button>
      )}
    </aside>
  );
}
