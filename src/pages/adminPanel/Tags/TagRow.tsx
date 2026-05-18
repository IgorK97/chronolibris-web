import React, { useState, useRef, useEffect } from 'react';
import { useInfiniteChildTags, useDeleteTag } from '@/api/tags';
import { TAG_TYPES, type TagDetails } from '@/types';
import styles from './TagsTable.module.css';
import { ExpandChildButton } from '@/components/buttons/ExpandChildButton';
import { AlertDialog } from '@/components/dialogs/AlertDialog';
import { ArrowLeft } from 'lucide-react';

interface TagRowProps {
  tag: TagDetails;
  depth: number;
  isSelected: boolean;
  onSelectParent: (tag: TagDetails) => void;
}

export const TagRow: React.FC<TagRowProps> = ({
  tag,
  depth,
  isSelected,
  onSelectParent,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const deleteMutation = useDeleteTag();
  const loaderRef = useRef<HTMLTableRowElement | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const {
    data: childData,
    isLoading: childrenLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteChildTags(tag.id, 20, isExpanded);

  const allChildren = childData?.pages.flatMap((p) => p.items) ?? [];

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

  const handleDelete = () => {
    deleteMutation.mutate(tag.id);
    setDeleteModalOpen(false);
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
        <td
          className={styles['td']}
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          <span className={styles['id-cell']}>
            <ExpandChildButton
              hasChildren={tag.hasChildren}
              handleExpandClick={handleExpandClick}
              isExpanded={isExpanded}
            />

            {tag.id}
          </span>
        </td>

        <td className={styles['td']}>
          <span className={styles['name-cell']}>
            {tag.name}
            {tag.relationTypeName && (
              <span className={styles['relation-badge']}>
                {tag.relationTypeName}
              </span>
            )}
            {tag.parentTagName && (
              <span className={styles['parent-breadcrumb']}>
                <ArrowLeft /> {tag.parentTagName}
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
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setDeleteModalOpen(true);
            }}
            className={styles['delete-button']}
            disabled={deleteMutation.isPending || tag.hasChildren}
          >
            {deleteMutation.isPending ? '...' : 'Удалить'}
          </button>
        </td>
      </tr>

      <AlertDialog
        description={`Это действие нельзя будет отменить`}
        open={deleteModalOpen}
        title={`Вы действительно хотите удалить этот тег?`}
        handleAccept={() => {
          handleDelete();
        }}
        handleReject={() => {
          setDeleteModalOpen(false);
        }}
      />

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
                <TagRow
                  key={child.id}
                  tag={child}
                  depth={depth + 1}
                  isSelected={false}
                  onSelectParent={onSelectParent}
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
