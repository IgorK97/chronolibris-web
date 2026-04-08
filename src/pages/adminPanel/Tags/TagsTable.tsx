import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteRootTags } from '@/api/tags';
import { useDebounce } from '@/hooks/useDebounce';
import { TAG_TYPES, type TagDetails } from '@/types';
import { TagRow } from './TagRow';
import styles from './TagsTable.module.css';

interface TagsTableProps {
  onParentTagSelect: (tag: TagDetails) => void;
}

export const TagsTable: React.FC<TagsTableProps> = ({ onParentTagSelect }) => {
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  // resetKey передаётся в TagRow для сброса раскрытия при смене фильтров
  const [resetKey, setResetKey] = useState('initial');

  const pageSize = 20;
  const debouncedSearch = useDebounce(searchTerm, 500);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isSearchMode = Boolean(debouncedSearch);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteRootTags(selectedType, debouncedSearch || null, pageSize);

  const allRootTags = data?.pages.flatMap((page) => page.items) ?? [];

  // Сбросить раскрытие при смене фильтров
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResetKey(`${selectedType ?? 'all'}-${debouncedSearch}`);
  }, [debouncedSearch, selectedType]);

  // Infinite scroll корневого уровня
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelectParent = useCallback(
    (tag: TagDetails) => {
      setSelectedParentId(tag.id);
      onParentTagSelect(tag);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [onParentTagSelect]
  );

  const handleTypeChange = (typeId: number | null) => {
    setSelectedType(typeId);
  };

  return (
    <div className={styles['container']}>
      <div className={styles['filters']}>
        <div className={styles['filter-group']}>
          <label className={styles['label']}>Тип тега:</label>
          <select
            value={selectedType || ''}
            onChange={(e) =>
              handleTypeChange(e.target.value ? Number(e.target.value) : null)
            }
            className={styles['select']}
          >
            <option value="">Все типы</option>
            {TAG_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles['search-form']}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по названию..."
            className={styles['input']}
          />
        </div>
      </div>

      {isSearchMode && (
        <div className={styles['search-mode-notice']}>
          Поиск по всем уровням: «{debouncedSearch}»
          <span className={styles['search-mode-sub']}>
            {' '}
            — для тегов с родителем указан путь к родителю
          </span>
        </div>
      )}

      {isLoading ? (
        <div className={styles['loading']}>Загрузка...</div>
      ) : (
        <>
          <table className={styles['table']}>
            <thead>
              <tr>
                <th className={styles['th']}>ID</th>
                <th className={styles['th']}>Название</th>
                <th className={styles['th']}>Тип</th>
                <th className={styles['th']}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {allRootTags.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  depth={0}
                  isSelected={selectedParentId === tag.id}
                  onSelectParent={handleSelectParent}
                  resetKey={resetKey}
                />
              ))}
            </tbody>
          </table>

          {allRootTags.length === 0 && !isLoading && (
            <div className={styles['empty']}>
              {isSearchMode ? 'Теги по запросу не найдены' : 'Теги не найдены'}
            </div>
          )}

          <div ref={observerRef} className={styles['loader-trigger']}>
            {isFetchingNextPage
              ? 'Загрузка...'
              : hasNextPage
                ? 'Прокрутите ниже'
                : allRootTags.length > 0
                  ? 'Все теги загружены'
                  : ''}
          </div>
        </>
      )}
    </div>
  );
};
