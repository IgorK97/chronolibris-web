import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
// import { ReaderState, TextSegment, PageContent, PageSegment, CachedPage } from './types';
import styles from './Reader.module.css';

export interface TextSegment {
  t: string;
  xp: number[];
  c: string | TextSegment[];
}

export interface PageContent {
  segments: PageSegment[];
  pageNumber: number;
}

export interface PageSegment {
  originalIndex: number;
  text: string;
  isContinuation: boolean;
  continuationId?: string;
}

export interface ReaderState {
  currentPage: number;
  totalPages: number;
  fontSize: number;
  viewMode: 'single' | 'double';
  isLoading: boolean;
}

export interface CachedPage {
  pageNumber: number;
  content: PageContent;
  timestamp: number;
}

interface ReaderProps {
  filePath?: string;
  cacheSize?: number;
  preloadAhead?: number;
}

const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;
const DEFAULT_CACHE_SIZE = 10;
const DEFAULT_PRELOAD_AHEAD = 3;

export const Reader: React.FC<ReaderProps> = ({
  filePath = '/data/002.js',
  cacheSize = DEFAULT_CACHE_SIZE,
  preloadAhead = DEFAULT_PRELOAD_AHEAD,
}) => {
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [state, setState] = useState<ReaderState>({
    currentPage: 1,
    totalPages: 0,
    fontSize: DEFAULT_FONT_SIZE,
    viewMode: 'single',
    isLoading: true,
  });
  const [pageCache, setPageCache] = useState<Map<number, CachedPage>>(
    new Map()
  );
  const [pageHeights, setPageHeights] = useState<Map<number, number>>(
    new Map()
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const isFlipping = useRef(false);
  const estimatedCharsPerPage = useRef(800);

  // Загрузка файла
  useEffect(() => {
    const loadFile = async () => {
      try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        const data = await response.json();
        setSegments(data);
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Error loading file:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadFile();
  }, [filePath]);

  // Подсчёт символов на странице на основе текущего размера шрифта
  useEffect(() => {
    if (pageRef.current && segments.length > 0) {
      const container = pageRef.current;
      const charWidth = state.fontSize * 0.6;
      const lineHeight = state.fontSize * 1.5;
      const charsPerLine = Math.floor(container.clientWidth / charWidth);
      const linesPerPage = Math.floor(container.clientHeight / lineHeight);
      estimatedCharsPerPage.current = charsPerLine * linesPerPage * 0.9;

      // Пересчитать страницы при изменении размера шрифта
      setPageCache(new Map());
      setState((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [state.fontSize, segments.length]);

  // Генерация страницы
  const generatePage = useCallback(
    (pageNumber: number): PageContent => {
      if (segments.length === 0) return { segments: [], pageNumber };

      const segmentsList: PageSegment[] = [];
      let charCount = 0;
      let currentIndex = 0;
      const maxChars = estimatedCharsPerPage.current;

      // Пропускаем уже обработанные страницы
      for (let p = 1; p < pageNumber; p++) {
        let pageChars = 0;
        let idx = 0;
        while (idx < segments.length && pageChars < maxChars) {
          const segment = segments[idx];
          const text = typeof segment.c === 'string' ? segment.c : '';
          const remaining = text.length;

          if (pageChars + remaining <= maxChars) {
            pageChars += remaining;
            idx++;
          } else {
            pageChars = maxChars;
          }
        }
      }

      // Заполняем текущую страницу
      while (currentIndex < segments.length && charCount < maxChars) {
        const segment = segments[currentIndex];
        const text = typeof segment.c === 'string' ? segment.c : '';
        const remaining = text.length;
        const spaceLeft = maxChars - charCount;

        if (remaining <= spaceLeft) {
          segmentsList.push({
            originalIndex: currentIndex,
            text,
            isContinuation: false,
          });
          charCount += remaining;
          currentIndex++;
        } else {
          // Разбиваем длинный текст
          segmentsList.push({
            originalIndex: currentIndex,
            text: text.substring(0, spaceLeft),
            isContinuation: charCount > 0,
            continuationId: `seg-${currentIndex}`,
          });

          // Сохраняем остаток для следующей страницы
          const remainingText = text.substring(spaceLeft);
          segments.splice(currentIndex, 1, {
            ...segment,
            c: remainingText,
          });

          charCount = maxChars;
        }
      }

      return { segments: segmentsList, pageNumber };
    },
    [segments]
  );

  // Получение страницы из кэша или генерация
  const getPage = useCallback(
    (pageNumber: number): PageContent => {
      if (pageNumber < 1) return { segments: [], pageNumber };

      const cached = pageCache.get(pageNumber);
      if (cached) {
        return cached.content;
      }

      const content = generatePage(pageNumber);

      // Кэшируем с ограничением размера
      setPageCache((prev) => {
        const newCache = new Map(prev);
        if (newCache.size >= cacheSize) {
          const oldestKey = Array.from(newCache.keys()).sort(
            (a, b) =>
              (newCache.get(a)?.timestamp || 0) -
              (newCache.get(b)?.timestamp || 0)
          )[0];
          if (oldestKey !== undefined) newCache.delete(oldestKey);
        }
        newCache.set(pageNumber, {
          pageNumber,
          content,
          timestamp: Date.now(),
        });
        return newCache;
      });

      return content;
    },
    [pageCache, generatePage, cacheSize]
  );

  // Подсчёт общего количества страниц
  const calculateTotalPages = useCallback(() => {
    if (segments.length === 0) return 0;

    let totalChars = 0;
    segments.forEach((seg) => {
      if (typeof seg.c === 'string') {
        totalChars += seg.c.length;
      }
    });

    return Math.ceil(totalChars / estimatedCharsPerPage.current) || 1;
  }, [segments]);

  useEffect(() => {
    if (segments.length > 0 && estimatedCharsPerPage.current > 0) {
      const total = calculateTotalPages();
      setState((prev) => ({ ...prev, totalPages: total }));
    }
  }, [segments, calculateTotalPages]);

  // Навигация
  const goToPage = useCallback(
    (page: number) => {
      if (isFlipping.current) return;
      if (page < 1 || page > state.totalPages) return;

      isFlipping.current = true;
      setState((prev) => ({ ...prev, currentPage: page }));

      // Предзагрузка следующих страниц
      for (let i = 1; i <= preloadAhead; i++) {
        if (page + i <= state.totalPages) {
          getPage(page + i);
        }
      }

      setTimeout(() => {
        isFlipping.current = false;
      }, 300);
    },
    [state.totalPages, preloadAhead, getPage]
  );

  const nextPage = useCallback(() => {
    goToPage(state.currentPage + 1);
  }, [state.currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(state.currentPage - 1);
  }, [state.currentPage, goToPage]);

  // Управление размером шрифта
  const changeFontSize = useCallback((delta: number) => {
    setState((prev) => {
      const newSize = Math.min(
        MAX_FONT_SIZE,
        Math.max(MIN_FONT_SIZE, prev.fontSize + delta)
      );
      return { ...prev, fontSize: newSize };
    });
  }, []);

  // Переключение режима просмотра
  const toggleViewMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewMode: prev.viewMode === 'single' ? 'double' : 'single',
      currentPage: 1,
    }));
    setPageCache(new Map());
  }, []);

  // Получаем страницы для отображения
  const displayedPages = useMemo(() => {
    const pages: PageContent[] = [];

    if (state.viewMode === 'double') {
      const leftPage =
        state.currentPage % 2 === 0 ? state.currentPage : state.currentPage - 1;
      const rightPage = leftPage + 1;

      if (leftPage >= 1) pages.push(getPage(leftPage));
      if (rightPage <= state.totalPages) pages.push(getPage(rightPage));
    } else {
      pages.push(getPage(state.currentPage));
    }

    return pages;
  }, [state.currentPage, state.viewMode, state.totalPages, getPage]);

  // Обработка клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage]);

  if (state.isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Загрузка книги...</p>
      </div>
    );
  }

  return (
    <div className={styles.reader} ref={containerRef}>
      {/* Панель управления */}
      <div className={styles.toolbar}>
        <div className={styles.controls}>
          <button
            onClick={prevPage}
            disabled={state.currentPage <= 1}
            className={styles.navButton}
          >
            ← Назад
          </button>

          <span className={styles.pageInfo}>
            Страница {state.currentPage} из {state.totalPages}
          </span>

          <button
            onClick={nextPage}
            disabled={state.currentPage >= state.totalPages}
            className={styles.navButton}
          >
            Вперёд →
          </button>
        </div>

        <div className={styles.settings}>
          <button
            onClick={() => changeFontSize(-2)}
            className={styles.fontButton}
          >
            A-
          </button>
          <span className={styles.fontSize}>{state.fontSize}px</span>
          <button
            onClick={() => changeFontSize(2)}
            className={styles.fontButton}
          >
            A+
          </button>

          <button onClick={toggleViewMode} className={styles.modeButton}>
            {state.viewMode === 'single' ? '2 страницы' : '1 страница'}
          </button>
        </div>
      </div>

      {/* Область чтения */}
      <div className={styles.readingArea}>
        {state.viewMode === 'double' && state.currentPage > 1 && (
          <div className={styles.page}>
            {displayedPages[0]?.content.segments.map((seg, idx) => (
              <p
                key={`${displayedPages[0].pageNumber}-${idx}`}
                className={seg.isContinuation ? styles.continuation : ''}
                style={{ fontSize: `${state.fontSize}px` }}
              >
                {seg.text}
              </p>
            ))}
            <div className={styles.pageNumber}>
              {displayedPages[0].pageNumber}
            </div>
          </div>
        )}

        <div
          className={`${styles.page} ${styles.activePage} ${isFlipping.current ? styles.flipping : ''}`}
          ref={pageRef}
        >
          {displayedPages[
            state.viewMode === 'double' ? 1 : 0
          ]?.content.segments.map((seg, idx) => (
            <p
              key={`${displayedPages[state.viewMode === 'double' ? 1 : 0].pageNumber}-${idx}`}
              className={seg.isContinuation ? styles.continuation : ''}
              style={{ fontSize: `${state.fontSize}px` }}
            >
              {seg.text}
            </p>
          ))}
          <div className={styles.pageNumber}>
            {displayedPages[state.viewMode === 'double' ? 1 : 0].pageNumber}
          </div>
        </div>

        {state.viewMode === 'double' &&
          state.currentPage < state.totalPages && (
            <div className={styles.page}>
              {displayedPages[1]?.content.segments.map((seg, idx) => (
                <p
                  key={`${displayedPages[1].pageNumber}-${idx}`}
                  className={seg.isContinuation ? styles.continuation : ''}
                  style={{ fontSize: `${state.fontSize}px` }}
                >
                  {seg.text}
                </p>
              ))}
              <div className={styles.pageNumber}>
                {displayedPages[1].pageNumber}
              </div>
            </div>
          )}
      </div>

      {/* Навигация кликом */}
      <div className={styles.clickZones}>
        <div
          className={styles.prevZone}
          onClick={prevPage}
          role="button"
          tabIndex={0}
          aria-label="Предыдущая страница"
        />
        <div
          className={styles.nextZone}
          onClick={nextPage}
          role="button"
          tabIndex={0}
          aria-label="Следующая страница"
        />
      </div>

      {/* Прогресс бар */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${(state.currentPage / state.totalPages) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Reader;
