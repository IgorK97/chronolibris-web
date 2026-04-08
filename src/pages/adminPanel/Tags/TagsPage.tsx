import React, { useState, useCallback } from 'react';
import { TagsTable } from './TagsTable';
import { CreateTagForm } from './CreateTagForm';
import type { TagDetails } from '@/types';
import styles from './TagsPage.module.css';

export const TagsPage: React.FC = () => {
  const [selectedParentTag, setSelectedParentTag] = useState<TagDetails | null>(
    null
  );

  const handleParentTagSelect = useCallback((tag: TagDetails) => {
    setSelectedParentTag(tag);
  }, []);

  const handleParentTagClear = useCallback(() => {
    setSelectedParentTag(null);
  }, []);

  const handleTagCreated = useCallback(() => {
    setSelectedParentTag(null);
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Управление тегами</h1>

      <CreateTagForm
        selectedParentTag={selectedParentTag}
        onParentTagClear={handleParentTagClear}
        onSuccess={handleTagCreated}
      />

      <TagsTable onParentTagSelect={handleParentTagSelect} />
    </div>
  );
};
