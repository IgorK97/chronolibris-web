import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemes, useThemesByParentId, useThemeById } from '@/api/themes';
import type { ThemeDto } from '@/types';
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
              title={theme.name}
              style={{ overflowWrap: 'break-word' }}
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
  const [stack, setStack] = useState<number[]>([]);
  const [pendingId, setPendingId] = useState<number | null>(selectedThemeId);
  const [collapsed, setCollapsed] = useState(false);

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
    setStack((prev) => prev.slice(0, -1)); //не включая последний
    setPendingId(currentParentId);
  };

  const handleApply = () => {
    onSelect(pendingId);
  };

  return (
    <aside
      className={`${styles.panel} ${collapsed ? styles['panel-collapsed'] : ''}`}
    >
      <div className={styles.header} onClick={() => setCollapsed((v) => !v)}>
        <span className={styles.title}>ТЕМЫ</span>
        <button
          className={styles['toggle-btn']}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
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
          {pendingId !== null && (
            <button
              className={styles['apply-btn']}
              onClick={(e) => {
                e.stopPropagation();
                handleApply();
              }}
            >
              Перейти
            </button>
          )}

          {stack.length > 0 && (
            <button className={styles['back-btn']} onClick={handleBack}>
              <ChevronLeft size={14} />
              Назад
            </button>
          )}

          {currentParentId !== null && currentParentTheme.data && (
            <div
              className={`${styles['current-parent']} ${
                pendingId === currentParentId
                  ? styles['theme-item-pending']
                  : ''
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
              <span
                title={currentParentTheme.data.name}
                className={styles['current-parent-name']}
              >
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
        </>
      )}
    </aside>
  );
}
