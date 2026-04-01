// src/components/ThemeSelector/ThemeSelector.tsx
import React, { useState, useMemo } from 'react';
import { useAllThemesFlat } from '@/api/themes';
import type { ThemeDto } from '@/types/types';
import styles from './ThemeSelector.module.css';

interface ThemeSelectorProps {
  selectedThemes: ThemeDto[];
  onAdd: (theme: ThemeDto) => void;
  onRemove: (themeId: number) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedThemes,
  onAdd,
  onRemove,
}) => {
  const [query, setQuery] = useState('');
  const { data: allThemes } = useAllThemesFlat(query);

  // Фильтрация подсказок (исключаем уже выбранные)
  const suggestions = useMemo(() => {
    if (!query.trim() || !allThemes) return [];
    const lowerQuery = query.toLowerCase();
    return allThemes
      .filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) &&
          !selectedThemes.some((st) => st.id === t.id)
      )
      .slice(0, 5); // Ограничим 5 вариантами
  }, [query, allThemes, selectedThemes]);

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск темы..."
          className={styles.input}
        />
        {suggestions.length > 0 && (
          <ul className={styles.suggestions}>
            {suggestions.map((theme) => (
              <li
                key={theme.id}
                onClick={() => {
                  onAdd(theme);
                  setQuery('');
                }}
              >
                {theme.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.chipList}>
        {selectedThemes.map((theme) => (
          <div key={theme.id} className={styles.chip}>
            <span>{theme.name}</span>
            <button
              type="button"
              onClick={() => onRemove(theme.id)}
              className={styles.removeBtn}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
