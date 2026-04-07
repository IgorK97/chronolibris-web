// // pages/TagsPage.tsx
// import React from 'react';
// import { TagsTable } from './TagsTable';
// import { CreateTagForm } from './CreateTagForm';
// import styles from './TagsPage.module.css';

// export const TagsPage: React.FC = () => {
//   const handleTagCreated = () => {
//     // Можно добавить уведомление или логирование
//   };

//   return (
//     <div className={styles.container}>
//       <h1 className={styles.title}>Управление тегами</h1>

//       <CreateTagForm onSuccess={handleTagCreated} />

//       <TagsTable />
//     </div>
//   );
// };

// pages/TagsPage.tsx
import React, { useState, useCallback } from 'react';
import { TagsTable } from './TagsTable';
import { CreateTagForm } from './CreateTagForm';
import type { TagDetails } from '@/types/types';
import styles from './TagsPage.module.css';

export const TagsPage: React.FC = () => {
  // Состояние выбранного родителя хранится здесь — передаётся в обе стороны:
  // TagsTable может его установить, CreateTagForm его отображает и использует
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
