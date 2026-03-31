import {
  useState,
  // useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  useSearchParams,
  // useNavigate
} from 'react-router-dom';
// import { useStore } from '@stores/globalStore';
import {
  useInfiniteAdvancedSearch,
  useInfiniteSimpleSearch,
} from '@/api/search';
import type { BookSearchResult } from '@/api/search';
import { BookCard } from '@/components';
import styles from './SearchPage.module.css';
import {
  Funnel,
  // Search,
  // Wrench,
  X,
} from 'lucide-react';
import type { BookListItem } from '@/types/types';
import {
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToParams,
  type AdvancedFilters,
} from '../utils/filterParams';
import { useStore } from '@/stores/globalStore';
import { AdvancedSearchPanel } from './AdvancedSearchPanel';

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const urlQuery = searchParams.get('q') ?? '';
  const { setCurrentBook } = useStore();
  //to save for f5
  const filters: AdvancedFilters = useMemo(
    () => filtersFromParams(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()]
  );

  const setFilters = (next: AdvancedFilters) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      filtersToParams(next, updated);
      return updated;
    });
  };

  const hasFilters =
    filters.personFilters.length > 0 ||
    filters.requiredTagIds.length > 0 ||
    filters.excludedTagIds.length > 0 ||
    filters.themeId > 0;

  // const navigate = useNavigate();
  // const { user } = useStore();
  // const [inputValue, setInputValue] = useState(urlQuery);
  // useEffect(() => {
  //   setInputValue(urlQuery);
  // }, [urlQuery]);

  const queryReady = urlQuery.trim().length > 0;

  const simpleSearch = useInfiniteSimpleSearch(
    urlQuery,
    20,
    !hasFilters && queryReady
  );

  const advancedSearch = useInfiniteAdvancedSearch(
    urlQuery,
    {
      personFilters: filters.personFilters,
      requiredTagIds: filters.requiredTagIds,
      excludedTagIds: filters.excludedTagIds,
      themeId: filters.themeId,
    },
    20,
    hasFilters && queryReady
  );

  const active = hasFilters ? advancedSearch : simpleSearch;
  const allBooks = active.data?.pages.flatMap((p) => p.items) ?? [];
  const isLoading = active.isLoading;
  const isError = active.isError;
  const hasNextPage = active.hasNextPage;
  const isFetchingNext = active.isFetchingNextPage;
  const fetchNextPage = active.fetchNextPage;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const setSentinel = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNext)
          fetchNextPage();
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNext, fetchNextPage]
  );

  return (
    <div className={styles.page}>
      <div className={styles['filter-bar']}>
        <button
          className={`${styles['advanced-toggle']} ${
            showAdvanced ? styles['advanced-toggle-active'] : ''
          }`}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <Funnel />
          Фильтры
        </button>
        {hasFilters && (
          <button
            className={styles['reset-filters']}
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            <X size={14} /> Сбросить фильтры
          </button>
        )}
      </div>
      {showAdvanced && (
        <AdvancedSearchPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowAdvanced(false)}
        />
        // <AdvancedSearchStub onClose={() => setShowAdvanced(false)} />
      )}
      {urlQuery && !isLoading && !isError && (
        <div className={styles['results-header']}>
          {allBooks.length > 0
            ? `Результаты по запросу`
            : `По вашему запросу ничего не найдено`}
        </div>
      )}
      {!urlQuery && (
        <div className={styles['empty-state']}>
          <p className={styles['empty-text']}>Начните вводить название книги</p>
        </div>
      )}

      {isLoading && (
        <div className={styles['loading-state']}>
          <div className={styles.spinner} />
          <span>Поиск...</span>
        </div>
      )}

      {isError && (
        <div className={styles['error-state']}>
          Не удалось выполнить поиск. Попробуйте ещё раз.
        </div>
      )}
      {allBooks.length > 0 && (
        <div className={styles.results}>
          {allBooks.map((book) => (
            <BookCard
              key={book.id}
              bookInfo={toBookListItem(book)}
              onPress={() => {
                setCurrentBook(toBookListItem(book));
                onNavigateToBook(book.id);
              }}
            />
          ))}

          {/* Sentinel для IntersectionObserver */}
          <div ref={setSentinel} className={styles.sentinel} />

          {isFetchingNext && (
            <div className={styles['loading-more']}>
              <div className={styles['spinner-small']} />
              Загрузка...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
