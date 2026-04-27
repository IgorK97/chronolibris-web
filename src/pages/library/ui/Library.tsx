import { useCallback, useEffect, useRef } from 'react';
import { SectionHeader } from './SectionHeader';
import { BookCard } from '../../../components/Books';
import { type BookListItem } from '../../../types';
import { useStore } from '../../../stores/globalStore';
import { useSelectionBooksDefault } from '@api/collections';
import styles from './Library.module.css';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import {
  useAddBookToShelf,
  useRemoveBookFromShelf,
  useSelectionsInfinite,
} from '@/api/collections';
import {
  // collectionsApi,
  useShelves,
} from '@api/collections';

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
  // userId: number;
  onNavigateToBook: (book: BookListItem) => void;
  onNavigateToList: (id: number, title: string) => void;
  onFavoriteToggle?: (bookId: number, currentIsFavorite: boolean) => void;
}) => {
  const { data, isLoading } = useSelectionBooksDefault(id);

  const displayBooks = (data?.items ?? []).slice(0, 6);

  if (isLoading && !data) {
    return <div className={styles['loading-wrapper']}>Загрузка {title}…</div>;
  }

  if (!isLoading && displayBooks.length === 0) return null;
  return (
    <section>
      <SectionHeader
        title={title}
        onPress={() => onNavigateToList(id, title)}
      />
      <div className={styles['book-grid']}>
        {displayBooks.map((book: BookListItem) => (
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
  const { user, setCurrentBook, isReader } = useStore();
  const { data: shelves } = useShelves(user?.userName || '', isReader());
  const favoritesShelfId = shelves?.find((s) => s.shelfType === 1)?.id;
  // const queryClient = useQueryClient();
  const { mutateAsync: addBookToShelf } = useAddBookToShelf();
  const { mutateAsync: removeBookFromShelf } = useRemoveBookFromShelf();

  const handleFavoriteToggle = async (
    bookId: number,
    currentIsFavorite: boolean
  ) => {
    if (!favoritesShelfId) return;
    if (!currentIsFavorite)
      await addBookToShelf({ shelfId: favoritesShelfId, bookId });
    else await removeBookFromShelf({ shelfId: favoritesShelfId, bookId });
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
              // userId={user? ?? 0}
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
