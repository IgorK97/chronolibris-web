/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo } from 'react';
import { SectionHeader } from './SectionHeader'; // Наш переписанный заголовок
import { BookCard } from '../../../components/books';
import {
  SELECTION_TYPE,
  type BookListItem,
  type SelectionDetails,
} from '../../../types/types';
import { useStore } from '../../../stores/globalStore';
import { useSelectionBooks } from '../../../api/books';
import styles from './Library.module.css';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import { useSelection } from '@/api/collections';

interface LibraryProps {
  onNavigateToBook: (id: number) => void;
  onNavigateToList: (selectionId: number, title: string) => void;
}

// Отдельный компонент для каждой секции подборки
const SelectionSection = ({
  id,
  title,
  userId,
  onNavigateToBook,
  onNavigateToList,
}: {
  id: number;
  title: string;
  userId: number;
  onNavigateToBook: (book: BookListItem) => void;
  onNavigateToList: (id: number, title: string) => void;
}) => {
  const { data, isLoading, error } = useSelectionBooks(id);
  const displayBooks = data?.items.slice(0, 6) || [];

  if (isLoading)
    return <div className={styles['loading-wrapper']}>Загрузка {title}...</div>;
  console.log('SelectionSection render:', {
    id,
    title,
    data,
    error,
    displayBooks,
  });
  if (error || displayBooks.length === 0) return null;

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

  const {
    data: selections,
    isLoading: selectionsIsLoading,
    error,
  } = useSelection();

  // const sections = [
  //   { id: 4, title: 'Новое' },
  //   { id: 5, title: 'Часто читают' },
  //   { id: 2, title: 'История культуры' },
  //   { id: 1, title: 'Экономическая история' },
  //   { id: 3, title: 'История мира' },
  // ];

  const sortedSections = useMemo<SelectionDetails[]>(() => {
    if (!selections) return [];

    const permanent = selections
      .filter(
        (s) =>
          s.selectionTypeId === SELECTION_TYPE.NEWEST ||
          s.selectionTypeId === SELECTION_TYPE.POPULAR
      )
      .sort((a, b) => a.selectionTypeId - b.selectionTypeId);

    const manual = selections.filter(
      (s) => s.selectionTypeId === SELECTION_TYPE.MANUAL
    );

    return [...permanent, ...manual];
  }, [selections]);

  const navigateToBookHandler = (book: BookListItem) => {
    setCurrentBook(book);
    onNavigateToBook(book.id);
  };

  if (!user)
    return (
      <div className={styles['error-wrapper']}>
        Пожалуйста, войдите в систему
      </div>
    );

  if (selectionsIsLoading)
    return <div className={styles['error-wrapper']}>Загрузка подборок...</div>;

  return (
    <main className={styles['library-container']}>
      <div className={styles['scroll-container']}>
        {sortedSections.map((section) => (
          <ErrorBoundary key={section.id}>
            <SelectionSection
              id={section.id}
              title={section.name}
              userId={user.userId}
              onNavigateToBook={navigateToBookHandler}
              onNavigateToList={onNavigateToList}
            />
          </ErrorBoundary>
        ))}
      </div>
    </main>
  );
};
