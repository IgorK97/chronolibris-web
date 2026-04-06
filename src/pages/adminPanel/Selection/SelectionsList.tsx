// components/Selections/SelectionsList.tsx
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSelectionsInfinite } from '@/api/collections';
import styles from './SelectionsList.module.css';

type ActiveFilter = 'active' | 'hidden' | 'all';

interface SelectionsListProps {
  onSelectSelection: (selectionId: number) => void;
  /** Показывать фильтр скрытых/всех подборок — только для администратора */
  isAdmin?: boolean;
}

export const SelectionsList: React.FC<SelectionsListProps> = ({
  onSelectSelection,
  isAdmin = false,
}) => {
  const [filter, setFilter] = useState<ActiveFilter>('active');

  const onlyActive: boolean | undefined =
    filter === 'active' ? true : filter === 'hidden' ? false : undefined;

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSelectionsInfinite(20, onlyActive);

  const selections = data?.pages.flatMap((p) => p.items) ?? [];

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '150px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersection]);

  // При смене фильтра данные сбрасываются автоматически —
  // useInfiniteQuery получает новый queryKey и стартует с нуля.
  const handleFilterChange = (next: ActiveFilter) => setFilter(next);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles['container']}>
      <div className={styles['header']}>
        <h2 className={styles['title']}>Подборки</h2>

        <div className={styles['filter-bar']}>
          <button
            className={`${styles['filter-btn']} ${filter === 'active' ? styles['filter-btn--active'] : ''}`}
            onClick={() => handleFilterChange('active')}
          >
            Активные
          </button>
          {isAdmin && (
            <>
              <button
                className={`${styles['filter-btn']} ${filter === 'hidden' ? styles['filter-btn--active'] : ''}`}
                onClick={() => handleFilterChange('hidden')}
              >
                Скрытые
              </button>
              {/* <button
                className={`${styles['filter-btn']} ${filter === 'all' ? styles['filter-btn--active'] : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                Все
              </button> */}
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className={styles['loading']}>Загрузка…</div>
      ) : error ? (
        <div className={styles['error']}>Ошибка загрузки</div>
      ) : (
        <>
          <div className={styles['grid']}>
            {selections.map((selection) => (
              <div
                key={selection.id}
                className={`${styles['card']} ${!selection.isActive ? styles['card--hidden'] : ''}`}
                onClick={() => onSelectSelection(selection.id)}
              >
                {!selection.isActive && (
                  <span className={styles['badge-hidden']}>Скрыта</span>
                )}
                <h3 className={styles['card-title']}>{selection.name}</h3>
                <p className={styles['description']}>{selection.description}</p>
                <div className={styles['meta']}>
                  <span>Книг: {selection.booksCount ?? '—'}</span>
                  {selection.createdAt && (
                    <span>
                      {new Date(selection.createdAt).toLocaleDateString(
                        'ru-RU'
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {selections.length === 0 && (
              <p className={styles['empty']}>Подборок не найдено</p>
            )}
          </div>

          {/* Sentinel — подгружает следующую страницу при появлении во вьюпорте */}
          <div ref={sentinelRef} style={{ height: 1 }} />

          {isFetchingNextPage && (
            <div className={styles['loading']}>Загрузка…</div>
          )}
        </>
      )}
    </div>
  );
};
