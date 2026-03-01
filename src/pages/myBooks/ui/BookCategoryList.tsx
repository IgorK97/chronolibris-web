import React, { useEffect, useRef } from 'react';
import { useStore } from '../../../stores/globalStore';
import { BookCard } from '../../../components/books';
import type {
  // BookDetails,
  BookListItem,
} from '../../../types/types';
import {
  useInfiniteReadBooks,
  useInfiniteShelfBooks,
} from '../../../api/books';
import styles from './BookCategoryList.module.css';
import { useShelves } from '../../../api/collections';

interface BookListByCategoryProps {
  CategoryId: number; // -1: История, -2: Локальные, >0: Полки
  onNavigateToBook: (id: number) => void;
  setCurrentBook: (book: BookListItem) => void;
}

export const BookListByCategory = ({
  CategoryId,
  setCurrentBook,
  onNavigateToBook,
}: BookListByCategoryProps) => {
  const { user } = useStore(); // Больше не берем shelves отсюда
  const observerTarget = useRef<HTMLDivElement>(null);

  // Получаем полки через React Query
  const { data: shelves, isLoading: isShelvesLoading } = useShelves(
    user?.userId || 0
  );

  // Определяем ID полки
  const SHELF_ID = shelves?.find((s) => s.shelfType === CategoryId)?.id;

  // Запросы к книгам
  const readQuery = useInfiniteReadBooks(user?.userId || 0);

  // Ключевой момент: запрос не начнется, пока SHELF_ID не определен (через enabled)
  const shelfQuery = useInfiniteShelfBooks(user?.userId || 0, SHELF_ID);

  const activeQuery = CategoryId === -1 ? readQuery : shelfQuery;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isBooksLoading,
  } = activeQuery;

  // ... логика Infinite Scroll (без изменений) ...

  const isLoading = isShelvesLoading || isBooksLoading;
  // Infinite Scroll logic
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
  if (isLoading && !data) {
    return <div className={styles.centerLoader}>Загрузка...</div>;
  }

  const navigateToBookHandler = (book: BookListItem) => {
    setCurrentBook(book);
    onNavigateToBook(book.id);
  };

  const allBooks = data?.pages.flatMap((page) => page.items) || [];

  if (isLoading) {
    return <div className={styles.centerLoader}>Загрузка списка книг...</div>;
  }

  return (
    <div className={styles['container']}>
      <div className={styles['grid']}>
        {allBooks.map((book) => (
          <BookCard
            key={book.id}
            bookInfo={book}
            onPress={() => navigateToBookHandler(book)}
          />
        ))}
      </div>

      <div ref={observerTarget} className={styles['sentinel']}>
        {isFetchingNextPage && (
          <div className={styles.centerLoader}>Подгружаем...</div>
        )}
      </div>
    </div>
  );
};
