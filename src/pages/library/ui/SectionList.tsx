import {
  // React,
  useEffect,
  useRef,
} from 'react';
import { BookCard } from '../../../components/books';
import type { BookListItem } from '../../../types/types';
import { useStore } from '../../../stores/globalStore';
import { useInfiniteSelectionBooks } from '../../../api/books'; // путь к вашим хукам
import styles from './SectionList.module.css';
import { useParams, useLocation } from 'react-router-dom';

interface SelectionListViewProps {
  onGoBack: () => void;
  onNavigateToBook: (id: number) => void;
  setCurrentBook: (book: BookListItem) => void;
}

export const SelectionListView = ({
  onGoBack,
  onNavigateToBook,
  setCurrentBook,
}: SelectionListViewProps) => {
  const { user } = useStore();
  const observerTarget = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>(); // Достаем ID из URL
  const location = useLocation();
  const initialTitle = location.state?.title || 'Подборка';
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteSelectionBooks(user?.userId || 0, parseInt(id || '0'));

  // Имитация Infinite Scroll через Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const navigateToBookHandler = (book: BookListItem) => {
    setCurrentBook(book);
    onNavigateToBook(book.id);
  };

  if (!user) return null;

  // Плоский список книг из всех страниц React Query
  const allBooks = data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className={styles['safe-area']}>
      <header className={styles['header']}>
        <button className={styles['back-button']} onClick={onGoBack}>
          {'<'}
        </button>
        <h1 className={styles['title']}>{initialTitle}</h1>
      </header>

      {isLoading ? (
        <div className={styles['loader']}>Загрузка...</div>
      ) : (
        <div className={styles['grid']}>
          {allBooks.map((book) => (
            <div key={book.id} className={styles['card-wrapper']}>
              <BookCard
                bookInfo={book}
                onPress={() => navigateToBookHandler(book)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Элемент, за который "цепляется" глаз браузера для подгрузки */}
      <div ref={observerTarget} className={styles['observer-sentinel']}>
        {isFetchingNextPage && (
          <div className={styles['footer-loader']}>Загружаем еще...</div>
        )}
      </div>
    </div>
  );
};
