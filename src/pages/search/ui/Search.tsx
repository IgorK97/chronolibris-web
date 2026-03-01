import React, {
  useState,
  useEffect,
  useMemo,
  // type ReactNode
} from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useInView } from 'react-intersection-observer'; // Рекомендую установить: npm i react-intersection-observer
import { useTranslation } from 'react-i18next';
import styles from './Search.module.css';
import { useDebounce } from '../../../hooks/useDebounce';

// Mocking internal imports - replace with your actual web-paths
import { BookCard } from '../../../components';
import { useStore } from '../../../stores/globalStore';
import type { BookFilters, BookListItem } from '../../../types/types';
import { useInfiniteSearch } from '../../../api/books';
import { useQuery } from '@tanstack/react-query';

const languages = [
  'Русский',
  'Английский',
  'Французский',
  'Японский',
  'Китайский',
  'Испанский',
  'Немецкий',
];

// const genres = {
//   Философия: {
//     "Русская философия": { "19 век": null, "20 век": null },
//     "Древняя философия": { Античная: null, Восточная: null },
//   },
//   История: { Древняя: null, Современность: null },
//   Экономика: {
//     "История экономики России": { "19 век": null, "Советский период": null },
//     "История мировой экономики": null,
//   },
// };

interface Genre {
  id: number;
  name: string;
  count: number;
  hasChildren: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fetchGenres = async (parentId: number | null): Promise<Genre[]> => {
  return [];
};

interface FilterNodeProps {
  genre: Genre;
  selectedIds: number[];
  onToggle: (id: number) => void;
}

const FilterNode = ({ genre, selectedIds, onToggle }: FilterNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedIds.includes(genre.id);

  const { data: children, isLoading } = useQuery({
    queryKey: ['genres', genre.id],
    queryFn: () => fetchGenres(genre.id),
    enabled: isExpanded && genre.hasChildren,
  });

  return (
    <div className={styles.nodeWrapper}>
      <div className={styles.nodeHeader}>
        <button
          className={styles.expandBtn}
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!genre.hasChildren}
        >
          {genre.hasChildren ? (isExpanded ? '[-]' : '[+]') : ' '}
        </button>
        <span className={styles.genreName}>
          {genre.name} <span className={styles.count}>({genre.count})</span>
        </span>

        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(genre.id)}
          className={styles.checkbox}
        />
      </div>

      {isExpanded && (
        <div className={styles.childrenList}>
          {isLoading && <div>Загрузка...</div>}
          {children?.map((child) => (
            <FilterNode
              key={child.id}
              genre={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SearchProps {
  setCurrentBook: (book: BookListItem) => void;
  onNavigateToBook: (bookId: number) => void;
}

export const Search = ({ onNavigateToBook, setCurrentBook }: SearchProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedQuery = useDebounce(searchQuery, 500);
  const { user } = useStore();
  const { t } = useTranslation();

  const [tempFilters, setTempFilters] = useState<BookFilters>({
    languages: [] as string[],
    genreIds: [] as number[],
    rating: null,
    yearFrom: '',
    yearTo: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(tempFilters);

  // 3. Используем твой новый хук
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    // isError,
  } = useInfiniteSearch(user?.userId || 0, {
    query: debouncedQuery,
    filters: appliedFilters,
  });

  // 4. Бесконечный скролл через Intersection Observer
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Плоский список книг из всех страниц пагинации
  const allBooks = useMemo(
    () => data?.pages.flatMap((page) => page.items) || [],
    [data]
  );

  const { data: rootGenres } = useQuery({
    queryKey: ['genres', 'root'],
    queryFn: () => fetchGenres(null),
    enabled: open, // Загружаем только при открытии фильтров
  });

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultFilters: BookFilters = {
      languages: [],
      genreIds: [],
      rating: null,
      yearFrom: '',
      yearTo: '',
    };
    setTempFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  if (!user) return null;

  const navigateToBookHandler = (book: BookListItem) => {
    setCurrentBook(book);
    onNavigateToBook(book.id);
  };
  const toggleGenre = (id: number) => {
    setTempFilters((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(id)
        ? prev.genreIds.filter((gid) => gid !== id)
        : [...prev.genreIds, id],
    }));
  };

  return (
    <div className={styles['container']}>
      <div className={styles['search-bar']}>
        <FiSearch color="#888" style={{ marginRight: 8 }} />
        <input
          className={styles['search-input']}
          placeholder={t('search.ph')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          // onKeyDown={(e) => {
          //   if (e.key === "Enter") search(searchQuery, user.userId, 10);
          // }}
        />
      </div>

      <button className={styles['button']} onClick={() => setOpen(true)}>
        {t('search.filters')} {appliedFilters.genreIds.length > 0 && '*'}
      </button>

      {isLoading ? (
        <div className={styles['loader']}>Загрузка...</div>
      ) : (
        <div className={styles['book-grid']}>
          {allBooks.map((item) => (
            <div key={item.id}>
              <BookCard
                bookInfo={item}
                onPress={() => navigateToBookHandler(item)}
              />
            </div>
          ))}
        </div>
      )}

      <div ref={ref} style={{ height: 20 }}>
        {isFetchingNextPage && 'Загружаем еще...'}
      </div>
      {/* {loadingMore && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          Loading more...
        </div>
      )} */}

      {/* Modal - Rendered conditionally for Web */}
      {open && (
        <div className={styles['modal-overlay']} onClick={() => setOpen(false)}>
          <div
            className={styles['modal-content']}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ padding: '0 20px' }}>{t('search.title_filters')}</h2>

            <div className={styles['scroll-area']}>
              <FilterSection title={t('search.title_lang_sect')}>
                {languages.map((lang) => (
                  <SelectableItem
                    key={lang}
                    label={lang}
                    selected={tempFilters.languages.includes(lang)}
                    onPress={() =>
                      setTempFilters((prev) => ({
                        ...prev,
                        languages: prev.languages.includes(lang)
                          ? prev.languages.filter((l) => l !== lang)
                          : [...prev.languages, lang],
                      }))
                    }
                  />
                ))}
              </FilterSection>

              <FilterSection title={t('search.title_genre_sect')}>
                {rootGenres?.map((genre) => (
                  <FilterNode
                    key={genre.id}
                    genre={genre}
                    selectedIds={tempFilters.genreIds}
                    onToggle={toggleGenre}
                  />
                ))}
              </FilterSection>

              <FilterSection title={t('search.title_mark')}>
                {[5, 4, 3, 2, 1].map((r) => (
                  <SelectableItem
                    key={r}
                    label={`${r}★ ${t('search.mark_label')}`}
                    selected={tempFilters.rating === r}
                    onPress={() =>
                      setTempFilters((prev) => ({
                        ...prev,
                        rating: r,
                      }))
                    }
                  />
                ))}
              </FilterSection>

              <FilterSection title={t('search.title_year_sect')}>
                <div className={styles['year-row']}>
                  <input
                    className={styles['year-input']}
                    placeholder={t('search.ph_from')}
                    type="number"
                    value={tempFilters.yearFrom}
                    onChange={(e) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        yearFrom: e.target.value,
                      }))
                    }
                  />
                  <span>—</span>
                  <input
                    className={styles['year-input']}
                    placeholder={t('search.ph_to')}
                    type="number"
                    value={tempFilters.yearTo}
                    onChange={(e) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        yearTo: e.target.value,
                      }))
                    }
                  />
                </div>
              </FilterSection>
            </div>

            <div className={styles['footer']}>
              <button
                onClick={handleReset}
                className={`${styles['footer-button']} ${styles['reset-button']}`}
              >
                {t('search.reset')}
              </button>
              <button
                onClick={() => handleApplyFilters()}
                className={`${styles['footer-button']} ${styles['apply-button']}`}
              >
                {t('search.apply')}
              </button>
            </div>

            <button
              className={styles['close-button']}
              onClick={() => setOpen(false)}
            >
              <FiX color="#333" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface FilterSectionProps {
  title: string;

  children: React.ReactNode;

  // styles: ReturnType<typeof useSearchStyles>;

  // typography: ReturnType<typeof useTypography>;
}

const FilterSection = ({ title, children }: FilterSectionProps) => (
  <div className={styles['section']}>
    <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{title}</h3>

    {children}
  </div>
);

const SelectableItem = ({
  label,

  selected,

  onPress,
}: {
  label: string;

  selected?: boolean;

  onPress: () => void;

  // styles: ReturnType<typeof useSearchStyles>;

  // typography: ReturnType<typeof useTypography>;
}) => (
  <button
    className={`${styles['selectable-item']} ${selected ? styles['selectable-selected'] : ''}`}
    onClick={onPress}
  >
    {label}
  </button>
);
