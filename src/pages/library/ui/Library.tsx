import React, { useCallback, useEffect, useRef } from 'react';
import { SectionHeader } from './SectionHeader';
import { BookCard } from '../../../components/books';
import { type BookListItem } from '../../../types/types';
import { useStore } from '../../../stores/globalStore';
import { useSelectionBooks } from '../../../api/books';
import styles from './Library.module.css';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import { useSelectionsInfinite } from '@/api/collections';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionsApi, useShelves } from '@api/collections';

interface LibraryProps {
  onNavigateToBook: (id: number) => void;
  onNavigateToList: (selectionId: number, title: string) => void;
}

const SelectionSection = ({
  id,
  title,
  onNavigateToBook,
  onNavigateToList,
  onFavoriteToggle,
}: {
  id: number;
  title: string;
  userId: number;
  onNavigateToBook: (book: BookListItem) => void;
  onNavigateToList: (id: number, title: string) => void;
  onFavoriteToggle?: (bookId: number, currentIsFavorite: boolean) => void;
}) => {
  const { data, isLoading } = useSelectionBooks(id);

  const displayBooks = (data?.items ?? []).slice(0, 6);

  if (isLoading && !data) {
    return <div className={styles['loading-wrapper']}>Загрузка {title}…</div>;
  }

  // Если книг нет (и это не промежуточное состояние рефетча) — не рендерим секцию
  if (!isLoading && displayBooks.length === 0) return null;

  // Во время рефетча показываем старые данные (stale-while-revalidate),
  // не скрываем секцию — это предотвращает мигание при возврате со страниц
  return (
    <section>
      <SectionHeader
        title={title}
        onPress={() => onNavigateToList(id, title)}
      />
      <div className={styles['book-grid']}>
        {displayBooks.map((book) => (
          <BookCard
            key={book.id}
            bookInfo={book}
            onPress={() => onNavigateToBook(book)}
            onFavoriteToggle={onFavoriteToggle}
          />
        ))}
      </div>
    </section>
  );
};

export const Library = ({
  onNavigateToBook,
  onNavigateToList,
}: LibraryProps) => {
  const { user, setCurrentBook } = useStore();
  const { data: shelves } = useShelves(user?.userId || 0);
  const favoritesShelfId = shelves?.find((s) => s.shelfType === 1)?.id;
  const queryClient = useQueryClient();

  const favoriteMutation = useMutation({
    mutationFn: ({ bookId, add }: { bookId: number; add: boolean }) => {
      if (!favoritesShelfId)
        return Promise.reject('Не указана полка избранного');
      return add
        ? collectionsApi.addBookToShelf(favoritesShelfId, bookId)
        : collectionsApi.removeBookFromShelf(favoritesShelfId, bookId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selection'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      // queryClient.invalidateQueries({ queryKey: ['shelfBooks'] });
    },
  });

  const handleFavoriteToggle = (bookId: number, currentIsFavorite: boolean) => {
    if (!favoritesShelfId) return;
    favoriteMutation.mutate({ bookId, add: !currentIsFavorite });
  };
  const {
    data,
    isLoading: selectionsIsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSelectionsInfinite(20);

  const selections = data?.pages.flatMap((p) => p.items) ?? [];

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '200px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersection]);

  const navigateToBookHandler = (book: BookListItem) => {
    setCurrentBook(book);
    onNavigateToBook(book.id);
  };

  if (selectionsIsLoading) {
    return <div className={styles['error-wrapper']}>Загрузка подборок…</div>;
  }

  return (
    <main className={styles['library-container']}>
      <div className={styles['scroll-container']}>
        {selections.map((section) => (
          <ErrorBoundary key={section.id}>
            <SelectionSection
              id={section.id}
              title={section.name}
              userId={user?.userId ?? 0}
              onNavigateToBook={navigateToBookHandler}
              onNavigateToList={onNavigateToList}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </ErrorBoundary>
        ))}

        <div ref={sentinelRef} style={{ height: 1 }} />

        {isFetchingNextPage && (
          <div className={styles['loading-wrapper']}>Загрузка подборок…</div>
        )}
      </div>
    </main>
  );
};
