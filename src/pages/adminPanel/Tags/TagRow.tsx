// components/Tags/TagRow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useInfiniteChildTags, useDeleteTag, TAG_TYPES } from '@/api/tags';
import type { TagDetails } from '@/types/types';
import styles from './TagsTable.module.css';

interface TagRowProps {
  tag: TagDetails;
  depth: number;
  isSelected: boolean;
  onSelectParent: (tag: TagDetails) => void;
  /** Принудительно закрыть при смене фильтров. Передаём ключ сброса. */
  resetKey?: string;
}

export const TagRow: React.FC<TagRowProps> = ({
  tag,
  depth,
  isSelected,
  onSelectParent,
  resetKey,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const deleteMutation = useDeleteTag();
  const loaderRef = useRef<HTMLTableRowElement | null>(null);

  // Сброс раскрытия при смене фильтров
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsExpanded(false);
  }, [resetKey]);

  const {
    data: childData,
    isLoading: childrenLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteChildTags(tag.id, 20, isExpanded);

  const allChildren = childData?.pages.flatMap((p) => p.items) ?? [];

  // Infinite scroll для дочерних тегов этой строки
  useEffect(() => {
    if (!isExpanded || !loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [isExpanded, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Удалить тег «${tag.name}»?`)) {
      deleteMutation.mutate(tag.id);
    }
  };

  const handleRowClick = () => {
    onSelectParent(tag);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((v) => !v);
  };

  const indent = depth * 24;

  return (
    <>
      <tr
        className={`${styles['tr']} ${isSelected ? styles['tr-selected'] : ''}`}
        onClick={handleRowClick}
        title="Нажмите, чтобы выбрать как родительский тег"
      >
        {/* ID + кнопка раскрытия */}
        <td
          className={styles['td']}
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          <span className={styles['id-cell']}>
            {tag.hasChildren ? (
              <button
                className={styles['expand-button']}
                onClick={handleExpandClick}
                aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
              >
                {isExpanded ? '▾' : '▸'}
              </button>
            ) : (
              <span className={styles['expand-placeholder']} />
            )}
            {tag.id}
          </span>
        </td>

        {/* Название + бейдж типа отношения */}
        <td className={styles['td']}>
          <span className={styles['name-cell']}>
            {tag.name}
            {tag.relationTypeName && (
              <span className={styles['relation-badge']}>
                {tag.relationTypeName}
              </span>
            )}
            {/* В режиме поиска показываем breadcrumb */}
            {tag.parentTagName && (
              <span className={styles['parent-breadcrumb']}>
                ← {tag.parentTagName}
              </span>
            )}
          </span>
        </td>

        <td className={styles['td']}>
          {tag.tagTypeName ??
            TAG_TYPES.find((t) => t.id === tag.tagTypeId)?.name ??
            tag.tagTypeId}
        </td>

        <td className={styles['td']}>
          <button
            onClick={handleDelete}
            className={styles['delete-button']}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? '...' : 'Удалить'}
          </button>
        </td>
      </tr>

      {/* Дочерние строки */}
      {isExpanded && (
        <>
          {childrenLoading ? (
            <tr>
              <td
                colSpan={4}
                className={styles['td']}
                style={{ paddingLeft: `${indent + 36}px` }}
              >
                <span className={styles['loading-inline']}>Загрузка…</span>
              </td>
            </tr>
          ) : (
            <>
              {allChildren.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className={styles['td']}
                    style={{ paddingLeft: `${indent + 36}px` }}
                  >
                    <span className={styles['empty-children']}>
                      Нет дочерних тегов
                    </span>
                  </td>
                </tr>
              )}
              {allChildren.map((child) => (
                // Рекурсия: дочерние TagRow тоже самостоятельно управляют раскрытием
                <TagRow
                  key={child.id}
                  tag={child}
                  depth={depth + 1}
                  isSelected={isSelected && false} // только листовой выбор через onSelectParent
                  onSelectParent={onSelectParent}
                  resetKey={resetKey}
                />
              ))}
              {hasNextPage && (
                <tr ref={loaderRef}>
                  <td
                    colSpan={4}
                    className={styles['td']}
                    style={{ paddingLeft: `${indent + 36}px` }}
                  >
                    {isFetchingNextPage ? (
                      <span className={styles['loading-inline']}>
                        Загрузка…
                      </span>
                    ) : null}
                  </td>
                </tr>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};
