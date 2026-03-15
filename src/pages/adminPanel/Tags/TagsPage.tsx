// pages/TagsPage.tsx
import React from 'react';
import { TagsTable } from './TagsTable';
import { CreateTagForm } from './CreateTagForm';
import styles from './TagsPage.module.css';

export const TagsPage: React.FC = () => {
  const handleTagCreated = () => {
    // Можно добавить уведомление или логирование
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Управление тегами</h1>

      <CreateTagForm onSuccess={handleTagCreated} />

      <TagsTable />
    </div>
  );
};
