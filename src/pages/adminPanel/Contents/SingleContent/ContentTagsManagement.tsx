/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Contents/ContentTagsManager.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  useContentTags,
  useSearchTags,
  useAddTagToContent,
  useRemoveTagFromContent,
} from '@/api/contents';
import type { TagDetails } from '@/types/types';
import styles from './ContentTagsManagement.module.css';
import { TagChip } from '@/components/TagChip';

interface ContentTagsManagerProps {
  contentId: number;
}

export const ContentTagsManager: React.FC<ContentTagsManagerProps> = ({
  contentId,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: tags, refetch: refetchTags } = useContentTags(contentId);
  const { data: searchResults } = useSearchTags(searchTerm);
  const addMutation = useAddTagToContent();
  const removeMutation = useRemoveTagFromContent();

  const handleRemoveTag = async (tagId: number) => {
    if (window.confirm('Удалить этот тег из контента?')) {
      try {
        await removeMutation.mutateAsync({ contentId, tagId });
        refetchTags();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка при удалении тега');
      }
    }
  };

  const handleAddTag = async (tag: TagDetails) => {
    try {
      await addMutation.mutateAsync({ contentId, tagId: tag.id });
      setSearchTerm('');
      setShowSearch(false);
      refetchTags();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при добавлении тега');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length >= 2) {
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowSearch(false), 200);
  };

  // Закрытие по клику вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const existingTagIds = tags?.map((t) => t.id) || [];

  return (
    <div className={styles['tags-container']}>
      <div className={styles['tags-header']}>
        <h3 className={styles['tags-title']}>Теги ({tags?.length || 0})</h3>
      </div>

      <div className={styles['tags-list']}>
        {tags && tags.length > 0 ? (
          tags.map((tag) => (
            <TagChip
              key={tag.id}
              disabled={removeMutation.isPending}
              onClick={() => handleRemoveTag(tag.id)}
              tagName={tag.name}
              tagTypeName={tag.tagTypeName}
              readOnly={false}
            />
          ))
        ) : (
          <div className={styles['tags-empty']}>Теги не добавлены</div>
        )}
      </div>

      <div className={styles['tags-add']} ref={searchRef}>
        <div className={styles['search-wrapper']}>
          {/* <button
            onClick={() => setShowSearch(!showSearch)}
            className={styles['add-button']}
            title="Добавить тег"
          >
            +
          </button> */}
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => searchTerm.length >= 2 && setShowSearch(true)}
            onBlur={handleBlur}
            placeholder="Поиск тега..."
            className={styles['search-input']}
          />
        </div>

        {showSearch && searchResults && searchResults.length > 0 && (
          <div className={styles['search-results']}>
            {searchResults
              .filter((tag) => !existingTagIds.includes(tag.id))
              .map((tag) => (
                <div
                  key={tag.id}
                  className={styles['search-result-item']}
                  onClick={() => handleAddTag(tag)}
                >
                  <span className={styles['result-name']}>{tag.name}</span>
                  <span className={styles['result-type']}>
                    {tag.tagTypeName}
                  </span>
                </div>
              ))}
            {searchResults.filter((tag) => !existingTagIds.includes(tag.id))
              .length === 0 && (
              <div className={styles['search-no-results']}>
                Все найденные теги уже добавлены
              </div>
            )}
          </div>
        )}

        {showSearch &&
          searchTerm.length >= 2 &&
          (!searchResults || searchResults.length === 0) && (
            <div className={styles['search-no-results']}>Теги не найдены</div>
          )}
      </div>
    </div>
  );
};
