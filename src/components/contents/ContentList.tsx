import React, { useEffect, useRef } from 'react';
import { useInfiniteContents } from '@/api/contents';
import type { ContentDto, ContentFilterRequest } from '@/types';
import styles from './ContentList.module.css';

interface ContentListProps {
  items?: ContentDto[];
  filter?: ContentFilterRequest;
  renderActions: (content: ContentDto) => React.ReactNode;
  onTitleClick?: (content: ContentDto) => void;
  additionalColumns?: Array<{
    header: string;
    render: (content: ContentDto) => React.ReactNode;
  }>;
}

export const ContentList: React.FC<ContentListProps> = ({
  items: staticItems,
  filter,
  renderActions,
  onTitleClick,
  additionalColumns = [],
}) => {
  const isStatic = !!staticItems;
  const {
    data: dynamicData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteContents(
    filter ?? { limit: 20, lastId: null, searchQuery: null },
    {
      enabled: !isStatic,
    }
  );

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isStatic) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isStatic, fetchNextPage]);

  const allContents = isStatic
    ? staticItems
    : dynamicData?.pages.flatMap((page) => page.items) || [];

  if (!isStatic && isLoading) {
    return <div className={styles['loading']}>Загрузка...</div>;
  }

  return (
    <>
      <table className={styles['contents-table']}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Авторы</th>
            <th>Год</th>
            {additionalColumns.map((col, idx) => (
              <th key={idx}>{col.header}</th>
            ))}
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {allContents.map((content) => (
            <tr key={content.id}>
              <td>{content.id}</td>
              <td
                className={onTitleClick ? styles['clickable'] : undefined}
                onClick={onTitleClick ? () => onTitleClick(content) : undefined}
              >
                {content.title}
              </td>
              <td>{content.authors.join(', ')}</td>
              <td>
                {content.yearFrom
                  ? content.yearTo
                    ? content.yearTo == content.yearFrom
                      ? `${content.yearFrom}`
                      : `${content.yearFrom}-${content.yearTo}`
                    : content.yearFrom
                  : content.yearTo
                    ? content.yearTo
                    : '-'}
              </td>
              {additionalColumns.map((col, idx) => (
                <td key={idx}>{col.render(content)}</td>
              ))}
              <td>{renderActions(content)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isStatic && (
        <div ref={observerRef} className={styles['loader-trigger']}>
          {isFetchingNextPage
            ? 'Загрузка...'
            : hasNextPage
              ? 'Загрузить еще'
              : 'Конец списка'}
        </div>
      )}
    </>
  );
};
