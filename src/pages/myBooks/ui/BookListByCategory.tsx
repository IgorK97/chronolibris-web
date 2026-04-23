import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../../stores/globalStore';
import {
  useInfiniteShelfBooks,
  useRemoveBookFromShelf,
} from '@api/collections';
// import { collectionsApi } from '../../../api/collections';
import { ManagedBookCard } from './ManagedBookCard';
import { ShelfSelectionModal } from './ShelfSelectionModal';
import styles from './BookCategoryList.module.css';
import type { BookListItem } from '@/types';
import { createPortal } from 'react-dom';

interface Props {
  shelfId: number;
  onNavigateToBook: (id: number) => void;
}

export const BookListByCategory = ({ shelfId, onNavigateToBook }: Props) => {
  const { user, setCurrentBook } = useStore();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [editingBook, setEditingBook] = useState<BookListItem | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // isLoading,
    refetch,
  } = useInfiniteShelfBooks(user?.userId || 0, shelfId);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const { mutateAsync: removeBookFromShelf } = useRemoveBookFromShelf();
  const allBooks = data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className={styles['container']}>
      <div className={styles['grid']}>
        {allBooks.map((book: BookListItem) => (
          <ManagedBookCard
            key={book.id}
            book={book}
            onPress={() => {
              setCurrentBook(book);
              onNavigateToBook(book.id);
            }}
            onRemove={async (id) => {
              await removeBookFromShelf({ shelfId, bookId: id });
              // refetch();
            }}
            onEdit={(book) => setEditingBook(book)}
          />
        ))}
      </div>

      <div ref={observerTarget} className={styles['sentinel']}>
        {isFetchingNextPage && <div>Загрузка...</div>}
      </div>

      {editingBook &&
        createPortal(
          <ShelfSelectionModal
            bookId={editingBook.id}
            onClose={() => setEditingBook(null)}
            onRefresh={refetch}
          />,
          document.body
        )}
    </div>
  );
};
