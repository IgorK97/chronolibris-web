/* eslint-disable react-hooks/exhaustive-deps */
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
import type { BookSearchResult } from '@/types';
import { BookCard } from '@/components';
import styles from './SearchPage.module.css';
import {
  Funnel,
  // Search,
  // Wrench,
  X,
} from 'lucide-react';
import type { BookListItem } from '@/types';
import {
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToParams,
  type AdvancedFilters,
} from '../../../utils/filterParams';
import { useStore } from '@/stores/globalStore';
import { AdvancedSearchPanel } from './AdvancedSearchPanel';
import { ThemePanel } from './ThemePanel';
import { SelectionPanel } from './SelectionPanel';
import { useResolveFilterNames } from '@/hooks/useResolveFilterNames';
import {
  useAddBookToShelf,
  useRemoveBookFromShelf,
  useShelves,
} from '@/api/collections';
// import { Circles } from 'react-loading-icons';

interface SearchPageProps {
  onNavigateToBook: (bookdId: number) => void;
}

function toBookListItem(book: BookSearchResult): BookListItem {
  return {
    id: book.id,
    title: book.title,
    coverUri: book.coverPath || null,
    averageRating: book.averageRating ?? 0,
    ratingsCount: 0, //Пока не возвращаю из поиска, да и не нужно
    isFavorite: book.isFavorite,
    authors: book.authors,
    isReviewable: book.isReviewable,
  };
}

export default function SearchPage({ onNavigateToBook }: SearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const urlQuery = searchParams.get('q') ?? '';
  const filters: AdvancedFilters = useMemo(
    () => filtersFromParams(searchParams),
    [searchParams.toString()]
  );
  const filtersCurrent: AdvancedFilters = useMemo(
    () => filtersFromParams(searchParams),
    [
      searchParams.get('personFilters'),
      searchParams.get('requiredTagIds'),
      searchParams.get('excludedTagIds'),
    ]
  );

  const [mode, setMode] = useState(false);

  const setFilters = useCallback((next: AdvancedFilters) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      filtersToParams(next, updated);
      return updated;
    });
  }, []);

  const { isResolving } = useResolveFilterNames({
    filters: filtersCurrent,
    onInvalidIds: setFilters,
  });

  const themeId: number = Number(searchParams.get('themeId') ?? '0') || 0;

  const setThemeId = (id: number | null) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (id == null || id === 0) {
        updated.delete('themeId');
      } else {
        updated.set('themeId', String(id));
      }
      return updated;
    });
  };

  const selectionId: number =
    Number(searchParams.get('selectionId') ?? '0') || 0;

  const setSelectionId = (id: number | null) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (id == null || id === 0) {
        updated.delete('selectionId');
      } else {
        updated.set('selectionId', String(id));
      }
      return updated;
    });
  };

  const hasFilters =
    filters.personFilters.length > 0 ||
    filters.requiredTagIds.length > 0 ||
    filters.excludedTagIds.length > 0 ||
    themeId > 0 ||
    selectionId > 0;
  const { user, setCurrentBook, isReader } = useStore();

  const isAdmin = user?.role === 'admin';

  const queryReady = urlQuery.trim().length > 0;

  const { data: shelves } = useShelves(user?.userName || '', isReader());
  const favoritesShelfId = shelves?.find((s) => s.shelfType === 1)?.id;
  const { mutateAsync: addBookToShelf } = useAddBookToShelf();
  const { mutateAsync: removeBookFromShelf } = useRemoveBookFromShelf();
  const simpleSearch = useInfiniteSimpleSearch(
    urlQuery,
    20,
    !hasFilters && queryReady,
    mode
  );

  const advancedSearch = useInfiniteAdvancedSearch(
    urlQuery,
    {
      personFilters: filters.personFilters,
      requiredTagIds: filters.requiredTagIds,
      excludedTagIds: filters.excludedTagIds,
      themeId,
      selectionId,
    },
    20,
    hasFilters,
    mode
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

  const hasNonThemeFilters =
    filters.personFilters.length > 0 ||
    filters.requiredTagIds.length > 0 ||
    filters.excludedTagIds.length > 0;

  return (
    <div className={styles.page}>
      <div className={styles['content-layout']}>
        <div className={styles['sidebar']}>
          <ThemePanel
            selectedThemeId={themeId || null}
            onSelect={(id) => setThemeId(id)}
          />
          <SelectionPanel
            selectedSelectionId={selectionId || null}
            onSelect={(id) => setSelectionId(id)}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div className={styles['filter-bar']}>
            <button
              className={`${styles['advanced-toggle']} ${
                showAdvanced ? styles['advanced-toggle-active'] : ''
              }`}
              onClick={() => setShowAdvanced((v) => !v)}
            >
              <Funnel />
              Фильтры
              {/* {isResolving && <Circles />} */}
              {isResolving && (
                <span
                  className={styles['spinner-small']}
                  style={{ marginLeft: 6 }}
                />
              )}
            </button>
            {hasNonThemeFilters && (
              <button
                className={styles['reset-filters']}
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                <X style={{ cursor: 'pointer' }} size={14} /> Сбросить настройки
                расширенного поиска
              </button>
            )}
          </div>
          {showAdvanced && (
            <AdvancedSearchPanel
              filters={filters}
              onChange={setFilters}
              onClose={() => setShowAdvanced(false)}
              mode={mode}
              onModeChange={isAdmin ? setMode : undefined}
            />
          )}

          <div className={styles['results-area']}>
            {isLoading && (
              <div className={styles['loading-state']}>
                <div className={styles.spinner} />
                <span>Поиск...</span>
              </div>
            )}

            {isError && (
              <div className={styles['error-state']}>
                Не удалось выполнить поиск. Попробуйте ещё раз
              </div>
            )}
            {allBooks.length > 0 && (
              <div className={styles['results']}>
                {allBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    bookInfo={toBookListItem(book)}
                    onPress={() => {
                      setCurrentBook(toBookListItem(book));
                      onNavigateToBook(book.id);
                    }}
                    onFavoriteToggle={async () => {
                      if (!favoritesShelfId) return;
                      if (book.isFavorite)
                        await removeBookFromShelf({
                          shelfId: favoritesShelfId,
                          bookId: book.id,
                        });
                      else
                        await addBookToShelf({
                          shelfId: favoritesShelfId,
                          bookId: book.id,
                        });
                    }}
                  />
                ))}
                <div ref={setSentinel} className={styles.sentinel} />

                {isFetchingNext && (
                  <div className={styles['loading-more']}>
                    <div className={styles['spinner-small']} />
                    Загрузка...
                  </div>
                )}
              </div>
            )}
            {!allBooks ||
              (allBooks.length == 0 && (
                <div className={styles['results']}>
                  По вашему запросу ничего не найдено
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
