import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
// import { ReaderState, TextSegment, PageContent, PageSegment, CachedPage, Note } from './types';
import styles from './Reader.module.css';

export interface Footnote {
  t: string;
  xp: number[];
  c: TextSegment[];
}

export interface Note {
  t: string;
  role: string;
  xp: number[];
  c: string;
  f?: Footnote;
}

export interface TextSegment {
  t: string;
  xp: number[];
  c: string | TextSegment[] | (string | Note)[];
}

export interface PageSegment {
  originalIndex: number;
  text: string;
  isContinuation: boolean;
  continuationId?: string;
  type: string;
  notes?: Note[];
}

export interface PageContent {
  segments: PageSegment[];
  pageNumber: number;
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
  const [originalSegments, setOriginalSegments] = useState<TextSegment[]>([]);
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
  const [pagePositions, setPagePositions] = useState<
    Map<number, { segmentIndex: number; charOffset: number }>
  >(new Map());

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const isFlipping = useRef(false);
  const estimatedCharsPerPage = useRef(800);
  const isCalculatingRef = useRef(false);
  const pagePositionsRef = useRef<
    Map<number, { segmentIndex: number; charOffset: number }>
  >(new Map());
  //   const originalSegmentsRef = useRef<TextSegment[]>([]);

  // Загрузка файла
  useEffect(() => {
    const loadFile = async () => {
      try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        const data = await response.json();
        setOriginalSegments(data);
        // originalSegmentsRef.current = JSON.parse(JSON.stringify(data));
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Error loading file:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadFile();
  }, [filePath]);

  // Сброс сегментов при изменении размера шрифта
  useEffect(() => {
    if (originalSegments.length > 0) {
      //   setOriginalSegments(JSON.parse(JSON.stringify(originalSegmentsRef.current)));
      setPageCache(new Map());
      setPagePositions(new Map());
      setState((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [state.fontSize, originalSegments.length]);

  // Подсчёт символов на странице
  useEffect(() => {
    if (
      pageRef.current &&
      originalSegments.length > 0 &&
      !isCalculatingRef.current
    ) {
      isCalculatingRef.current = true;
      const container = pageRef.current;
      const charWidth = state.fontSize * 0.6;
      const lineHeight = state.fontSize * 1.5;
      const charsPerLine = Math.floor(container.clientWidth / charWidth);
      const linesPerPage = Math.floor(container.clientHeight / lineHeight);
      estimatedCharsPerPage.current = charsPerLine * linesPerPage * 0.85;

      calculateTotalPages();
      isCalculatingRef.current = false;
    }
  }, [state.fontSize, originalSegments.length]);

  // Извлечение текста из сегмента
  const extractText = useCallback((segment: TextSegment): string => {
    if (typeof segment.c === 'string') {
      return segment.c;
    } else if (Array.isArray(segment.c)) {
      return segment.c
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item.t === 'note') return '';
          return extractText(item as TextSegment);
        })
        .join('');
    }
    return '';
  }, []);

  // Извлечение сносок из сегмента
  const extractNotes = useCallback((segment: TextSegment): Note[] => {
    const notes: Note[] = [];
    if (Array.isArray(segment.c)) {
      segment.c.forEach((item) => {
        if (typeof item !== 'string' && item.t === 'note') {
          notes.push(item as Note);
        }
      });
    }
    return notes;
  }, []);

  //   // Генерация страницы
  //   const generatePage = useCallback(
  //     (pageNumber: number, currentSegments: TextSegment[]): PageContent => {
  //       if (currentSegments.length === 0) return { segments: [], pageNumber };

  //       const segmentsList: PageSegment[] = [];
  //       let charCount = 0;
  //       let currentIndex = 0;
  //       const maxChars = estimatedCharsPerPage.current;

  //       // Пропускаем уже обработанные страницы
  //       for (let p = 1; p < pageNumber; p++) {
  //         let pageChars = 0;
  //         let idx = 0;
  //         const tempSegments = [...currentSegments];

  //         while (idx < tempSegments.length && pageChars < maxChars) {
  //           const segment = tempSegments[idx];
  //           const text = extractText(segment);
  //           const remaining = text.length;

  //           if (pageChars + remaining <= maxChars) {
  //             pageChars += remaining;
  //             idx++;
  //           } else {
  //             pageChars = maxChars;
  //           }
  //         }
  //       }

  //       // Заполняем текущую страницу
  //       const workingSegments = [...currentSegments];
  //       while (currentIndex < workingSegments.length && charCount < maxChars) {
  //         const segment = workingSegments[currentIndex];
  //         const text = extractText(segment);
  //         const remaining = text.length;
  //         const spaceLeft = maxChars - charCount;

  //         if (remaining <= spaceLeft) {
  //           segmentsList.push({
  //             originalIndex: currentIndex,
  //             text,
  //             isContinuation: charCount > 0,
  //             continuationId: `seg-${currentIndex}`,
  //             type: segment.t,
  //             notes: extractNotes(segment),
  //           });
  //           charCount += remaining;
  //           currentIndex++;
  //         } else if (spaceLeft > 0) {
  //           // Разбиваем длинный текст
  //           segmentsList.push({
  //             originalIndex: currentIndex,
  //             text: text.substring(0, spaceLeft),
  //             isContinuation: charCount > 0,
  //             continuationId: `seg-${currentIndex}`,
  //             type: segment.t,
  //           });

  //           // Сохраняем остаток для следующей страницы
  //           const remainingText = text.substring(spaceLeft);
  //           workingSegments[currentIndex] = {
  //             ...segment,
  //             c: remainingText,
  //           };

  //           charCount = maxChars;
  //         } else {
  //           break;
  //         }
  //       }

  //       // Обновляем глобальные сегменты с учётом разбивки
  //       setSegments(workingSegments);

  //       return { segments: segmentsList, pageNumber };
  //     },
  //     [extractText, extractNotes]
  //   );

  const calculateTotalPages = useCallback(() => {
    if (originalSegments.length === 0 || estimatedCharsPerPage.current <= 0)
      return;

    let totalChars = 0;
    originalSegments.forEach((seg) => {
      totalChars += extractText(seg).length;
    });

    const total = Math.ceil(totalChars / estimatedCharsPerPage.current) || 1;
    setState((prev) => ({ ...prev, totalPages: total }));
  }, [originalSegments, extractText]);

  // Генерация страницы БЕЗ модификации исходных данных
  const generatePage = useCallback(
    (pageNumber: number): PageContent => {
      if (originalSegments.length === 0) return { segments: [], pageNumber };

      const segmentsList: PageSegment[] = [];
      let charCount = 0;
      const startPos = pagePositionsRef.current.get(pageNumber);
      let currentIndex = startPos?.segmentIndex ?? 0;
      let currentCharOffset = startPos?.charOffset ?? 0;
      const maxChars = estimatedCharsPerPage.current;

      // Проходим по всем сегментам и заполняем страницу
      for (
        let i = currentIndex;
        i < originalSegments.length && charCount < maxChars;
        i++
      ) {
        const segment = originalSegments[i];
        const fullText = extractText(segment);
        const textToUse =
          currentCharOffset > 0
            ? fullText.substring(currentCharOffset)
            : fullText;
        const remaining = textToUse.length;
        const spaceLeft = maxChars - charCount;

        if (remaining <= spaceLeft) {
          // Весь текст сегмента помещается на страницу
          segmentsList.push({
            originalIndex: i,
            text: textToUse,
            isContinuation: currentCharOffset > 0,
            continuationId: currentCharOffset > 0 ? `seg-${i}` : undefined,
            type: segment.t,
            notes: currentCharOffset === 0 ? extractNotes(segment) : undefined,
          });
          charCount += remaining;
          currentIndex = i + 1;
          currentCharOffset = 0;
        } else if (spaceLeft > 0) {
          // Текст не помещается полностью - разбиваем
          segmentsList.push({
            originalIndex: i,
            text: textToUse.substring(0, spaceLeft),
            isContinuation: currentCharOffset > 0 || charCount > 0,
            continuationId: `seg-${i}`,
            type: segment.t,
          });

          // Сохраняем позицию для следующей страницы
          setPagePositions((prev) => {
            const newMap = new Map(prev);
            newMap.set(pageNumber + 1, {
              segmentIndex: i,
              charOffset: currentCharOffset + spaceLeft,
            });
            return newMap;
          });

          charCount = maxChars;
          currentIndex = i;
          currentCharOffset = currentCharOffset + spaceLeft;
          pagePositionsRef.current.set(pageNumber + 1, {
            segmentIndex: i,
            charOffset: currentCharOffset,
          });
        } else {
          break;
        }
      }

      return { segments: segmentsList, pageNumber };
    },
    [originalSegments, extractText, extractNotes]
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
  //   const calculateTotalPages = useCallback(() => {
  //     if (segments.length === 0) return 0;

  //     let totalChars = 0;
  //     segments.forEach((seg) => {
  //       totalChars += extractText(seg).length;
  //     });

  //     return Math.ceil(totalChars / estimatedCharsPerPage.current) || 1;
  //   }, [segments, extractText]);

  //   useEffect(() => {
  //     if (segments.length > 0 && estimatedCharsPerPage.current > 0) {
  //       const total = calculateTotalPages();
  //       setState((prev) => ({ ...prev, totalPages: total }));
  //     }
  //   }, [segments, calculateTotalPages]);

  // Навигация
  const goToPage = useCallback(
    (page: number) => {
      if (isFlipping.current) return;
      if (page < 1 || page > state.totalPages) return;

      isFlipping.current = true;
      setState((prev) => ({ ...prev, currentPage: page }));

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

  const changeFontSize = useCallback((delta: number) => {
    setState((prev) => {
      const newSize = Math.min(
        MAX_FONT_SIZE,
        Math.max(MIN_FONT_SIZE, prev.fontSize + delta)
      );
      return { ...prev, fontSize: newSize };
    });
  }, []);

  const toggleViewMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewMode: prev.viewMode === 'single' ? 'double' : 'single',
      currentPage: 1,
    }));
    setPageCache(new Map());
    setPagePositions(new Map());
    // setOriginalSegments(
    //   JSON.parse(JSON.stringify(originalSegmentsRef.current))
    // );
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

  // Рендер сегмента
  const renderSegment = useCallback(
    (seg: PageSegment, index: number, pageNum: number) => {
      if (seg.type === 'br') {
        return <br key={`${pageNum}-${index}`} />;
      }

      if (seg.type === 'title') {
        return (
          <h2
            key={`${pageNum}-${index}`}
            className={styles['title']}
            style={{ fontSize: `${state.fontSize * 1.3}px` }}
          >
            {seg.text}
          </h2>
        );
      }

      return (
        <p
          key={`${pageNum}-${index}`}
          className={`${styles['paragraph']} ${seg.isContinuation ? styles['continuation'] : ''}`}
          style={{ fontSize: `${state.fontSize}px` }}
        >
          {seg.text}
          {seg.notes && seg.notes.length > 0 && (
            <span className={styles['footnote-marker']}>
              {seg.notes.map((note, i) => (
                <sup key={i}>{note.c}</sup>
              ))}
            </span>
          )}
        </p>
      );
    },
    [state.fontSize]
  );

  if (state.isLoading) {
    return (
      <div className={styles['loading']}>
        <div className={styles['spinner']}></div>
        <p>Загрузка книги...</p>
      </div>
    );
  }

  return (
    <div className={styles['reader']} ref={containerRef}>
      {/* Панель управления */}
      <div className={styles['toolbar']}>
        <div className={styles['controls']}>
          <button
            onClick={prevPage}
            disabled={state.currentPage <= 1}
            className={styles['nav-button']}
          >
            ← Назад
          </button>

          <span className={styles['page-info']}>
            Страница {state.currentPage} из {state.totalPages}
          </span>

          <button
            onClick={nextPage}
            disabled={state.currentPage >= state.totalPages}
            className={styles['nav-button']}
          >
            Вперёд →
          </button>
        </div>

        <div className={styles['settings']}>
          <button
            onClick={() => changeFontSize(-2)}
            className={styles['font-button']}
          >
            A-
          </button>
          <span className={styles['font-size']}>{state.fontSize}px</span>
          <button
            onClick={() => changeFontSize(2)}
            className={styles.fontButton}
          >
            A+
          </button>

          <button onClick={toggleViewMode} className={styles['mode-button']}>
            {state.viewMode === 'single' ? '2 страницы' : '1 страница'}
          </button>
        </div>
      </div>

      {/* Область чтения */}
      <div className={styles['reading-area']}>
        {displayedPages.map((page, pageIndex) => (
          <div
            key={page.pageNumber}
            className={`${styles.page} ${pageIndex === displayedPages.length - 1 ? styles['active-page'] : ''} ${isFlipping.current ? styles['flipping'] : ''}`}
            ref={pageIndex === displayedPages.length - 1 ? pageRef : null}
          >
            {page.segments.map((seg, idx) =>
              renderSegment(seg, idx, page.pageNumber)
            )}
            <div className={styles['page-number']}>{page.pageNumber}</div>
          </div>
        ))}
      </div>

      {/* Навигация кликом */}
      <div className={styles['click-zones']}>
        <div
          className={styles['prev-zone']}
          onClick={prevPage}
          role="button"
          tabIndex={0}
          aria-label="Предыдущая страница"
        />
        <div
          className={styles['next-zone']}
          onClick={nextPage}
          role="button"
          tabIndex={0}
          aria-label="Следующая страница"
        />
      </div>

      {/* Прогресс бар */}
      <div className={styles['progress-bar']}>
        <div
          className={styles['progress-fill']}
          style={{ width: `${(state.currentPage / state.totalPages) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Reader;
