import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '@stores/globalStore';
import { useInfiniteSimpleSearch } from '@/api/search';
import type { BookSearchResult } from '@/api/search';
import { BookCard } from '@/components';
import styles from './SearchPage.module.css';
import { Search, Wrench, X } from 'lucide-react';

function AdvancedSearchStub({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles['advanced-panel']}>
      <div className={styles['advanced-header']}>
        <span className={styles['advanced-title']}>Расширенный поиск</span>
        <button className={styles['advanced-close']} onClick={onClose}>
          <X />
        </button>
      </div>
      <div className={styles['advanced-stub']}>
        <div className={styles['stub-icon']}>
          <Wrench />
        </div>
        <p className={styles['stub-text']}>В разработке</p>
      </div>
    </div>
  );
}

interface SearchPageProps {
  onNavigateToBook: (bookdId: number) => void;
}

function toBookListItem(book: BookSearchResult): BookListItem {
  return {
    id: book.id,
    title: book.title,
    coverUri: book.coverPath || null,
    averageRating: book.averageRating ?? 0,
    ratingsCount: 0, // не возвращается из поиска — BookCard отобразит как есть
    isFavorite: book.isFavorite,
    authors: [], // не возвращается из поиска — при необходимости добавить в BookSearchResult
    isReviewable: book.isReviewable,
  };
}

export default function SearchPage({ onNavigateToBook }: SearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const urlQuery = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(urlQuery);
  const [showAdvanced, setShowAdvanced] = useState(false);
  useEffect(() => {
    setInputValue(urlQuery);
  }, [urlQuery]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteSimpleSearch(urlQuery, 20, urlQuery.trim().length > 0);

  const allBooks = data?.pages.flatMap((p) => p.items) ?? [];

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSearchParams({ q: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setSentinel = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  return (
    <div className={styles.page}>
      <div className={styles['search-bar']}>
        <div className={styles['search-input-wrapper']}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Введите название книги..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <Search />
        </div>
        <button
          className={`${styles['advanced-toggle']} ${
            showAdvanced ? styles['advanced-toggle-active'] : ''
          }`}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          Фильтры
        </button>
      </div>
      {showAdvanced && (
        <AdvancedSearchStub onClose={() => setShowAdvanced(false)} />
      )}
      {urlQuery && (
        <div className={styles.resultsHeader}>
          {!isLoading && !isError && (
            <span className={styles.resultsCount}>
              {allBooks.length > 0
                ? `Результаты по запросу «${urlQuery}»`
                : `Ничего не найдено по запросу «${urlQuery}»`}
            </span>
          )}
        </div>
      )}
      {!urlQuery && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <p className={styles.emptyText}>Начните вводить название книги</p>
        </div>
      )}

      {isLoading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Поиск...</span>
        </div>
      )}

      {isError && (
        <div className={styles.errorState}>
          Не удалось выполнить поиск. Попробуйте ещё раз.
        </div>
      )}
      {allBooks.length > 0 && (
        <div className={styles.results}>
          {allBooks.map((book) => (
            <BookCard
              key={book.id}
              bookInfo={toBookListItem(book)}
              onPress={() => onNavigateToBook(book.id)}
            />
          ))}

          {/* Sentinel для IntersectionObserver */}
          <div ref={setSentinel} className={styles.sentinel} />

          {isFetchingNextPage && (
            <div className={styles.loadingMore}>
              <div className={styles.spinnerSmall} />
              Загрузка...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
