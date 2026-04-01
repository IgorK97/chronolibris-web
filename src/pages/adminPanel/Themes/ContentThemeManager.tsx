// src/components/ContentThemeManager/ContentThemeManager.tsx
import React, { useState, useEffect } from 'react';
import type { ThemeDto } from '@/types/types';
import { ThemeSelector } from './ThemeSelector';
import { usePatchContent } from '@/api/contents';
import styles from './ContentThemeManager.module.css';

interface Props {
  contentId: number;
  initialThemes: ThemeDto[];
}

export const ContentThemeManager: React.FC<Props> = ({
  contentId,
  initialThemes,
}) => {
  const [currentThemes, setCurrentThemes] = useState<ThemeDto[]>(initialThemes);
  const [isSaved, setIsSaved] = useState(false);
  const patchMutation = usePatchContent();

  // Синхронизация, если данные подгрузились позже
  useEffect(() => {
    setCurrentThemes(initialThemes);
  }, [initialThemes]);

  // Проверка на наличие изменений
  const hasChanges =
    JSON.stringify(currentThemes.map((t) => t.id).sort()) !==
    JSON.stringify(initialThemes.map((t) => t.id).sort());

  const handleSave = async () => {
    try {
      await patchMutation.mutateAsync({
        id: contentId,
        themeIds: currentThemes.map((t) => t.id),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      alert('Ошибка при сохранении');
    }
  };

  const handleCancel = () => {
    setCurrentThemes(initialThemes);
  };

  return (
    <div className={styles.manager}>
      <h3>Темы контента</h3>

      <ThemeSelector
        selectedThemes={currentThemes}
        onAdd={(theme) => setCurrentThemes([...currentThemes, theme])}
        onRemove={(id) =>
          setCurrentThemes(currentThemes.filter((t) => t.id !== id))
        }
      />

      <div className={styles.actions}>
        {hasChanges ? (
          <>
            <button
              onClick={handleSave}
              className={styles.saveBtn}
              disabled={patchMutation.isPending}
            >
              {patchMutation.isPending
                ? 'Сохранение...'
                : 'Сохранить изменения'}
            </button>
            <button onClick={handleCancel} className={styles.cancelBtn}>
              Отмена
            </button>
          </>
        ) : (
          isSaved && <span className={styles.savedLabel}>✓ Сохранено</span>
        )}
      </div>
    </div>
  );
};
