// ============================================================
// Reader.tsx — компонент чтения книги на CSS columns
// ============================================================
import { createPortal } from 'react-dom';
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import styles from './Reader.module.css';

export interface Footnote {
  t: string;
  xp: number[];
  c: string | string[];
}

export interface Note {
  t: string;
  role: string;
  xp: number[];
  c: string;
  f?: Footnote;
}

export type InlineNode = Note | { t: 'em' | 'st'; c: string };

export interface ImgNode {
  t: 'img';
  src: string;
}

export interface TextSegment {
  t: string;
  xp?: number[];
  c: string | TextSegment[] | (string | InlineNode)[] | ImgNode[];
}

export interface TocPart {
  s: number; // глобальный 0-based индекс первого абзаца фрагмента
  e: number; // глобальный 0-based индекс последнего абзаца фрагмента
  xps: number[];
  xpe: number[];
  url: string;
}

export interface TocBodyItem {
  s: number;
  e: number;
  t: string;
  c?: TocBodyItem[];
}

export interface TocMeta {
  Title: string;
  Authors: { Role: string; First?: string; Last?: string }[];
  Annotation: string;
  Lang: string;
}

export interface TocData {
  Meta: TocMeta;
  full_length: number; // общее число абзацев в книге (1-based, т.е. абзацы 1..full_length)
  Body: TocBodyItem[];
  Parts: TocPart[];
}

interface ReaderProps {
  tocPath?: string;
  /** базовый путь для URL фрагментов, напр. '/data/' */
  basePath?: string;
  /** начальный файл, если нет toc */
  filePath?: string;
  imagePath?: string;
}

// export interface BookmarkAnchor {
//   paraIndex: number;
//   charOffset: number;
// }

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'none';

export interface Bookmark {
  id: number;
  paraIndex: number;
  bookFileId: number;
  note: string;
  createdAt: number;
  // start: BookmarkAnchor;
  // end: BookmarkAnchor;
  // selectedText: string;
  // highlightColor: HighlightColor;
}

const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;
const PREFETCH_THRESHOLD = 3;

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Palatino', value: "'Palatino Linotype', Palatino, serif" },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
];

const TEXT_COLORS = ['#1a1a1a', '#3b2a1a', '#1a2e1a', '#0d1b2a', '#4a4a4a'];
const PAGE_COLORS = ['#ffffff', '#f5f1e8', '#f0ede0', '#e8f0e8', '#e8eef5'];
const BG_COLORS = ['#f5f1e8', '#e8e0d0', '#d6cfc0', '#dde8dd', '#d0dce8'];

function buildUrl(base: string | undefined, url: string): string {
  if (!base) return url;
  return base.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
}

export const Reader: React.FC<ReaderProps> = ({
  tocPath,
  basePath,
  filePath,
  imagePath,
}) => {
  const [tocData, setTocData] = useState<TocData | null>(null);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [nextSegments, setNextSegments] = useState<TextSegment[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrefetching, setIsPrefetching] = useState(false);

  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [pageColor, setPageColor] = useState(PAGE_COLORS[0]);
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [currentCol, setCurrentCol] = useState(0); //Индекс текущей колонки-страницы
  const [totalCols, setTotalCols] = useState(0); //Общее количество колонок-страниц

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState<boolean>(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const pageGap = 0;

  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    paraIndex: number;
    x: number;
    y: number;
  } | null>(null);

  const pendingBookmarkParaRef = useRef<number | null>(null);

  // pendingCol: число >= 0 — конкретная колонка,
  //             число < 0 — ratio внутри фрагмента (умножить на totalCols),
  //             9999 — последняя страница
  const pendingColRef = useRef<number | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [twoPageMode, setTwoPageMode] = useState(false);

  // Загрузка toc

  useEffect(() => {
    if (!tocPath) return;
    fetch(tocPath)
      .then((r) => r.json())
      .then((data: TocData) => {
        setTocData(data);
        if (filePath) {
          const idx = data.Parts.findIndex((p) => filePath.endsWith(p.url));
          if (idx !== -1) setCurrentPartIndex(idx);
        }
      })
      .catch(console.error);
  }, [tocPath]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentUrl = useMemo(() => {
    if (tocData) {
      const part = tocData.Parts[currentPartIndex];
      if (part) return buildUrl(basePath, part.url);
    }
    return filePath ?? '';
  }, [tocData, currentPartIndex, basePath, filePath]);

  useEffect(() => {
    if (!currentUrl) return;
    setIsLoading(true);
    setNextSegments(null);
    setCurrentCol(0);
    fetch(currentUrl)
      .then((r) => r.json())
      .then((data: TextSegment[]) => {
        setSegments(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [currentUrl]);

  const recalcCols = () => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return;

    const pageWidth = twoPageMode
      ? vp.clientWidth / 2
      : vp.clientWidth - pageGap;

    const cols = Math.round(ct.scrollWidth / pageWidth);
    const newTotal = Math.max(1, cols);
    setTotalCols(newTotal);

    if (pendingColRef.current !== null) {
      let target: number;
      const pending = pendingColRef.current;
      if (pending === 9999) {
        target = newTotal - 1;
      } else if (pending < 0) {
        // ratio mode: pending = -ratio
        target = Math.round(-pending * (newTotal - 1));
      } else {
        target = Math.min(pending, newTotal - 1);
      }
      if (twoPageMode && target > 0) target = target - (target % 2);
      pendingColRef.current = null;
      setCurrentCol(target);
      vp.scrollTo({
        // left: target * ct.clientWidth,
        left: target * pageWidth,
        behavior: 'auto',
      });
    }
  };
  useEffect(() => {
    if (!isLoading) {
      const id = setTimeout(recalcCols, 50);
      return () => clearTimeout(id);
    }
  }, [isLoading, fontSize, fontFamily, segments]);

  useEffect(() => {
    window.addEventListener('resize', recalcCols);
    return () => window.removeEventListener('resize', recalcCols);
  }, []);

  useEffect(() => {
    if (!tocData || isLoading || isPrefetching || nextSegments !== null) return;
    if (totalCols === 0) return;
    const remaining = totalCols - 1 - currentCol;
    if (remaining > PREFETCH_THRESHOLD) return;

    const nextIdx = currentPartIndex + 1;
    if (nextIdx >= tocData.Parts.length) return;

    const nextUrl = buildUrl(basePath, tocData.Parts[nextIdx].url);
    setIsPrefetching(true);
    fetch(nextUrl)
      .then((r) => r.json())
      .then((data: TextSegment[]) => {
        setNextSegments(data);
        setIsPrefetching(false);
      })
      .catch(() => setIsPrefetching(false));
  }, [
    currentCol,
    totalCols,
    tocData,
    currentPartIndex,
    isLoading,
    isPrefetching,
    nextSegments,
    basePath,
  ]);

  // Навигация

  // const goToCol = useCallback(
  //   (col: number) => {
  //     const vp = viewportRef.current;
  //     if (!vp) return;

  //     // Вперёд за пределы фрагмента
  //     if (col >= totalCols && tocData) {
  //       const nextIdx = currentPartIndex + 1;
  //       if (nextIdx < tocData.Parts.length) {
  //         if (nextSegments !== null) {
  //           // Мгновенное переключение на предзагруженный фрагмент
  //           setSegments(nextSegments);
  //           setNextSegments(null);
  //           setCurrentCol(0);
  //           pendingColRef.current = 0;
  //         } else {
  //           pendingColRef.current = 0;
  //         }
  //         setCurrentPartIndex(nextIdx);
  //         return;
  //       }
  //     }

  //     // Назад за пределы фрагмента
  //     if (col < 0 && tocData) {
  //       const prevIdx = currentPartIndex - 1;
  //       if (prevIdx >= 0) {
  //         pendingColRef.current = 9999;
  //         setCurrentPartIndex(prevIdx);
  //         return;
  //       }
  //       return;
  //     }

  //     const clamped = Math.max(0, Math.min(col, totalCols - 1));
  //     console.log(col, totalCols - 1);
  //     const gap = clamped === totalCols - 1 ? 2 * pageGap : 0;
  //     console.log(gap);
  //     setCurrentCol(clamped);
  //     vp.scrollTo({
  //       left: clamped * (vp.clientWidth - pageGap),
  //       behavior: 'smooth',
  //     });
  //   },
  //   [totalCols, tocData, currentPartIndex, nextSegments, pageGap]
  // );

  const goToCol = (col: number) => {
    const vp = viewportRef.current;
    if (!vp) return;

    const pageWidth = twoPageMode ? vp.clientWidth / 2 : vp.clientWidth;
    console.log(pageWidth);
    if (col >= totalCols && tocData) {
      const nextIdx = currentPartIndex + 1;
      if (nextIdx < tocData.Parts.length) {
        if (nextSegments !== null) {
          setSegments(nextSegments);
          setNextSegments(null);
          setCurrentCol(0);
          pendingColRef.current = 0;
        } else {
          pendingColRef.current = 0;
        }
        setCurrentPartIndex(nextIdx);
        return;
      }
    }

    if (col < 0 && tocData) {
      const prevIdx = currentPartIndex - 1;
      if (prevIdx >= 0) {
        pendingColRef.current = 9999;
        setCurrentPartIndex(prevIdx);
        return;
      }
      return;
    }

    let clamped = Math.max(0, Math.min(col, totalCols - 1));
    // В режиме двух страниц всегда показываем левую страницу разворота
    if (twoPageMode && clamped > 0) clamped = clamped - (clamped % 2);
    const leftPos = clamped * pageWidth;

    // if (col + 1 === totalCols) leftPos += pageGap;
    console.log(col, totalCols, leftPos);
    setCurrentCol(clamped);
    vp.scrollTo({ left: leftPos, behavior: 'smooth' });
  };

  // const nextCol = useCallback(
  //   () => goToCol(currentCol + 1),
  //   [currentCol, goToCol]
  // );
  // const prevCol = useCallback(
  //   () => goToCol(currentCol - 1),
  //   [currentCol, goToCol]
  // );

  const nextCol = () => goToCol(currentCol + (twoPageMode ? 2 : 1));
  const prevCol = () => goToCol(currentCol - (twoPageMode ? 2 : 1));

  const changeFontSize = useCallback((delta: number) => {
    setFontSize((p) =>
      Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, p + delta))
    );
    setCurrentCol(0);
    viewportRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, []);

  const changeFontFamily = useCallback((value: string) => {
    setFontFamily(value);
    setCurrentCol(0);
    viewportRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, []);

  const readPercent = useMemo<number>(() => {
    // console.log('TOC-START');
    if (!tocData || tocData.Body[0].e === 0 || totalCols === 0) return 0;
    // console.log('TOC-MEDIUM', tocData.full_length);
    const part = tocData.Parts[currentPartIndex];
    if (!part) return 0;
    console.log('TOC_END');
    const colRatio = totalCols > 1 ? currentCol / (totalCols - 1) : 1;
    const globalPos = part.s + (part.e - part.s) * colRatio; // 0-based
    return Math.min(100, (globalPos / tocData.Body[0].e) * 100);
  }, [tocData, currentPartIndex, currentCol, totalCols]);

  // Клик по прогресс-бару

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tocData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    const targetGlobal = Math.round(ratio * tocData.Body[0].e); // 0-based

    const partIdx = tocData.Parts.findIndex(
      (p) => targetGlobal >= p.s && targetGlobal <= p.e
    );
    if (partIdx === -1) return;

    const part = tocData.Parts[partIdx];
    const withinRatio = (targetGlobal - part.s) / Math.max(1, part.e - part.s);

    if (partIdx === currentPartIndex) {
      // Тот же фрагмент
      // const targetCol = Math.round(withinRatio * (totalCols - 1));
      // goToCol(targetCol);
      let targetCol = Math.round(withinRatio * (totalCols - 1));
      if (twoPageMode && targetCol > 0) targetCol = targetCol - (targetCol % 2);
      goToCol(targetCol);
    } else {
      // Другой фрагмент: сохраняем ratio, меняем фрагмент
      pendingColRef.current = -withinRatio; // отрицательное = ratio mode
      setCurrentPartIndex(partIdx);
    }
  };

  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-ctx-menu'))
        setContextMenu(null);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu]);
  const bookFileId = 1;

  const createBookmark = useCallback(
    (paraIndex: number, note: string) => {
      const bm: Bookmark = {
        id: Math.random(),
        paraIndex,
        bookFileId,
        note,
        createdAt: Date.now(),
      };
      setBookmarks((prev) => [...prev, bm]);
      setContextMenu(null);
    },
    [bookFileId]
  );

  const updateBookmark = useCallback((id: number, note: string) => {
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, note } : b)));
    setEditingBookmark(null);
  }, []);

  const deleteBookmark = useCallback((id: number) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    setEditingBookmark(null);
  }, []);

  const navigateToBookmark = useCallback(
    (bm: Bookmark) => {
      if (!tocData) return;
      const globalIdx = bm.paraIndex - 1;
      const partIdx = tocData.Parts.findIndex(
        (p) => globalIdx >= p.s && globalIdx <= p.e
      );
      if (partIdx === -1) return;
      setBookmarkPanelOpen(false);

      const scrollToParaInDOM = (paraIdx: number) => {
        const el = contentRef.current?.querySelector(
          `[data-para-index="${paraIdx}"]`
        ) as HTMLElement | null;
        if (!el || !viewportRef.current) return false;

        const vpRect = viewportRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const elLeft =
          elRect.left - vpRect.left + viewportRef.current.scrollLeft;
        // const colWidth = viewportRef.current.clientWidth - pageGap;
        const colWidth = twoPageMode
          ? viewportRef.current.clientWidth / 2
          : viewportRef.current.clientWidth - pageGap;
        const targetCol = Math.max(0, Math.floor(elLeft / colWidth));

        if (targetCol !== currentCol) {
          setCurrentCol(targetCol);
          viewportRef.current.scrollTo({
            left: targetCol * (viewportRef.current.clientWidth - pageGap),
            behavior: 'smooth',
          });
        }
        return true;
      };
      if (partIdx === currentPartIndex) {
        setTimeout(() => scrollToParaInDOM(bm.paraIndex), 50);
      } else {
        pendingBookmarkParaRef.current = bm.paraIndex;
        setCurrentPartIndex(partIdx);
      }
    },
    [tocData, currentPartIndex, currentCol, twoPageMode]
  );

  useEffect(() => {
    if (pendingBookmarkParaRef.current === null) return;
    if (isLoading || totalCols === 0) return;
    const paraIdx = pendingBookmarkParaRef.current;
    pendingBookmarkParaRef.current = null;
    // Небольшая задержка — DOM должен окончательно отрендериться
    setTimeout(() => {
      const el = contentRef.current?.querySelector(
        `[data-para-index="${paraIdx}"]`
      ) as HTMLElement | null;
      if (!el || !viewportRef.current) return;
      const vpRect = viewportRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elLeft = elRect.left - vpRect.left + viewportRef.current.scrollLeft;
      // const colWidth = viewportRef.current.clientWidth - pageGap;
      const colWidth = twoPageMode
        ? viewportRef.current.clientWidth / 2
        : viewportRef.current.clientWidth - pageGap;
      const targetCol = Math.max(0, Math.floor(elLeft / colWidth));
      setCurrentCol(targetCol);
      viewportRef.current.scrollTo({
        left: targetCol * (viewportRef.current.clientWidth - pageGap),
        behavior: 'smooth',
      });
    }, 80);
  }, [isLoading, totalCols, segments, twoPageMode]);

  const renderInlineContent = useCallback(
    (content: (string | InlineNode)[]): React.ReactNode => {
      return content.map((item, idx) => {
        if (typeof item === 'string')
          return <React.Fragment key={idx}>{item}</React.Fragment>;
        if (item.t === 'em')
          return <em key={idx}>{(item as { t: string; c: string }).c}</em>;
        if (item.t === 'st')
          return (
            <strong key={idx}>{(item as { t: string; c: string }).c}</strong>
          );
        if (item.t === 'note') {
          const note = item as Note;
          return (
            <span
              key={idx}
              className={styles['note-ref']}
              onClick={(e) => {
                e.stopPropagation();
                setActiveNote(note);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveNote(note)}
            >
              {note.c}
            </span>
          );
        }
        return null;
      });
    },
    []
  );

  const renderSegment = (seg: TextSegment, index: number): React.ReactNode => {
    if (seg.t === 'br') return <br key={index} />;

    if (seg.t === 'img') {
      const imgNodes = Array.isArray(seg.c) ? seg.c : [];
      const firstImg = imgNodes.find(
        (n) => typeof n !== 'string' && (n as ImgNode).t === 'img'
      ) as ImgNode | undefined;
      if (!firstImg) return null;
      const fullUrl = imagePath
        ? `${imagePath.replace(/\/$/, '')}/${firstImg.src}`
        : firstImg.src;
      return (
        <div key={index} className={styles['img-block']}>
          <img
            src={fullUrl}
            alt=""
            className={styles['img-inline']}
            onClick={() => setActiveImage(fullUrl)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActiveImage(fullUrl)}
          />
        </div>
      );
    }

    const paraIndex = seg.xp?.[2] ?? 0;
    const paraBookmark =
      bookmarks.find(
        (bm) => bm.paraIndex === paraIndex && bm.bookFileId === bookFileId
      ) ?? null;

    const getContent = (): React.ReactNode => {
      if (typeof seg.c === 'string') return seg.c;
      if (Array.isArray(seg.c)) {
        return renderInlineContent(
          seg.c.map((item) =>
            typeof item === 'string' ? item : (item as InlineNode)
          )
        );
      }
      return null;
    };

    const textStyle = {
      fontSize: `${fontSize}px`,
      fontFamily,
      color: textColor,
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ paraIndex, x: e.clientX, y: e.clientY });
    };

    const bookmarkIcon = paraBookmark ? (
      <span
        className={styles['bookmark-icon']}
        title={paraBookmark.note || 'Закладка'}
        onClick={(e) => {
          e.stopPropagation();
          setEditingBookmark(paraBookmark);
        }}
      >
        🔖
      </span>
    ) : null;

    if (seg.t === 'title') {
      return (
        <h2
          key={index}
          className={styles['title']}
          style={textStyle}
          data-para-index={String(paraIndex)}
          onContextMenu={handleContextMenu}
        >
          {bookmarkIcon}
          {getContent()}
        </h2>
      );
    }
    return (
      <p
        key={index}
        className={`${styles['paragraph']} ${paraBookmark ? styles['paragraph-bookmarked'] : ''}`}
        style={textStyle}
        data-para-index={String(paraIndex)}
        onContextMenu={handleContextMenu}
      >
        {bookmarkIcon}
        {getContent()}
      </p>
    );
  };

  if (isLoading && segments.length === 0) {
    return (
      <div className={styles['loading']}>
        <div className={styles['spinner']} />
        <p>Загрузка книги...</p>
      </div>
    );
  }

  const hasPrev = currentCol > 0 || currentPartIndex > 0;
  const hasNext = tocData
    ? currentCol < totalCols - 1 || currentPartIndex < tocData.Parts.length - 1
    : currentCol < totalCols - 1;

  return (
    <div className={styles['reader']} style={{ background: bgColor }}>
      <TocSidebar
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        tocData={tocData}
        currentPartIndex={currentPartIndex}
        onSelectPart={(idx) => {
          pendingColRef.current = 0;
          setCurrentPartIndex(idx);
          setTocOpen(false);
        }}
      />

      <div
        className={`${styles['toolbar']} ${toolbarCollapsed ? styles['toolbar-collapsed'] : ''}`}
      >
        <button
          className={styles['toolbar-toggle']}
          onClick={() => setToolbarCollapsed((v) => !v)}
          aria-label={
            toolbarCollapsed ? 'Развернуть панель' : 'Свернуть панель'
          }
          title={toolbarCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
        >
          {toolbarCollapsed ? '▾' : '▴'}
        </button>
        <div className={styles['toolbar-inner']}>
          <div className={styles['controls']}>
            {tocData && (
              <button
                onClick={() => setTocOpen((v) => !v)}
                className={`${styles['nav-button']} ${tocOpen ? styles['nav-button-active'] : ''}`}
                aria-label="Содержание"
              >
                ☰ Содержание
              </button>
            )}
            <button
              onClick={prevCol}
              disabled={!hasPrev}
              className={styles['nav-button']}
            >
              ← Назад
            </button>
            <span className={styles['page-info']}>
              {/* {`Стр. ${currentCol + 1} / ${totalCols}`} */}
              {twoPageMode
                ? `Стр. ${Math.min(currentCol + 2, totalCols)} / ${totalCols}`
                : `Стр. ${currentCol + 1} / ${totalCols}`}
              {tocData && (
                <span className={styles['read-percent']}>
                  {' '}
                  ({readPercent.toFixed(0)}%)
                </span>
              )}
            </span>
            <button
              onClick={nextCol}
              disabled={!hasNext}
              className={styles['nav-button']}
            >
              Вперёд →
            </button>
            <button
              onClick={() => {
                setTwoPageMode((v) => !v);
                setCurrentCol(0);
                viewportRef.current?.scrollTo({ left: 0, behavior: 'auto' });
                setTimeout(recalcCols, 50);
              }}
              className={`${styles['nav-button']} ${twoPageMode ? styles['nav-button-active'] : ''}`}
              title={twoPageMode ? 'Одна страница' : 'Две страницы'}
              aria-label={twoPageMode ? 'Одна страница' : 'Две страницы'}
            >
              {twoPageMode ? '□' : '▯▯'}
            </button>
          </div>

          <div className={styles['settings']}>
            <select
              className={styles['font-select']}
              value={fontFamily}
              onChange={(e) => changeFontFamily(e.target.value)}
              aria-label="Выбор шрифта"
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setColorModalOpen(true)}
              className={styles['color-button']}
              aria-label="Настройка цветов"
              title="Цвета"
            >
              🎨
            </button>
            <button
              onClick={() => setBookmarkPanelOpen((v) => !v)}
              className={`${styles['color-button']} ${bookmarkPanelOpen ? styles['nav-button-active'] : ''}`}
              aria-label="Закладки"
              title={`Закладки (${bookmarks.filter((b) => b.bookFileId === bookFileId).length})`}
            >
              🔖{' '}
              {bookmarks.filter((b) => b.bookFileId === bookFileId).length > 0
                ? bookmarks.filter((b) => b.bookFileId === bookFileId).length
                : ''}
            </button>
            <button
              onClick={() => changeFontSize(-2)}
              className={styles['font-button']}
            >
              A-
            </button>
            <span className={styles['font-size']}>{fontSize}px</span>
            <button
              onClick={() => changeFontSize(2)}
              className={styles['font-button']}
            >
              A+
            </button>
          </div>
        </div>
      </div>
      {/* Область чтения */}
      {/* <div className={styles['reading-area']}>
        <div
          // className={styles['book-viewport']}
          className={`${styles['book-viewport']} ${twoPageMode ? styles['book-viewport-two'] : ''}`}
          ref={viewportRef}
          style={{ background: pageColor }}
        >
          <div
            // className={styles['book-content']}
            className={`${styles['book-content']} ${twoPageMode ? styles['book-content-two'] : ''}`}
            ref={contentRef}
          >
            {segments.map((seg, idx) => renderSegment(seg, idx))}
          </div>
        </div>
        <div
          className={styles['prev-zone']}
          onClick={prevCol}
          role="button"
          tabIndex={0}
          aria-label="Предыдущая страница"
        />
        <div
          className={styles['next-zone']}
          onClick={nextCol}
          role="button"
          tabIndex={0}
          aria-label="Следующая страница"
        />
      </div> */}

      <div className={styles['reading-area']}>
        {/* Строка 1 */}
        <div className={styles['pad-top']} />

        {/* Строка 2 */}
        <div className={styles['pad-left']} />
        <div
          className={`${styles['book-viewport']} ${twoPageMode ? styles['book-viewport-two'] : ''}`}
          ref={viewportRef}
          style={{ background: pageColor }}
        >
          <div
            className={`${styles['book-content']} ${twoPageMode ? styles['book-content-two'] : ''}`}
            ref={contentRef}
          >
            {segments.map((seg, idx) => renderSegment(seg, idx))}
          </div>
        </div>
        <div className={styles['pad-right']} />

        {/* Строка 3 */}
        <div className={styles['pad-bottom']} />

        <div
          className={styles['prev-zone']}
          onClick={prevCol}
          role="button"
          tabIndex={0}
          aria-label="Предыдущая страница"
        />
        <div
          className={styles['next-zone']}
          onClick={nextCol}
          role="button"
          tabIndex={0}
          aria-label="Следующая страница"
        />
      </div>
      {/* Кликабельный прогресс-бар */}
      <div
        className={styles['progress-bar']}
        onClick={handleProgressClick}
        role="slider"
        aria-valuenow={Math.round(readPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Прогресс чтения"
        title={`${readPercent.toFixed(0)}% прочитано`}
      >
        <div
          className={styles['progress-fill']}
          style={{ width: `${readPercent}%` }}
        />
      </div>

      {isPrefetching && (
        <div
          className={styles['prefetch-indicator']}
          title="Загрузка следующей части…"
        />
      )}

      <FootnoteModal note={activeNote} onClose={() => setActiveNote(null)} />
      <ImageLightbox src={activeImage} onClose={() => setActiveImage(null)} />
      <ColorModal
        open={colorModalOpen}
        onClose={() => setColorModalOpen(false)}
        textColor={textColor}
        pageColor={pageColor}
        bgColor={bgColor}
        onTextColor={setTextColor}
        onPageColor={setPageColor}
        onBgColor={setBgColor}
      />
      <BookmarkPanel
        open={bookmarkPanelOpen}
        onClose={() => setBookmarkPanelOpen(false)}
        bookmarks={bookmarks.filter((b) => b.bookFileId === bookFileId)}
        onEdit={setEditingBookmark}
        onDelete={deleteBookmark}
        onNavigate={navigateToBookmark}
      />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          paraIndex={contextMenu.paraIndex}
          existingBookmark={
            bookmarks.find(
              (b) =>
                b.paraIndex === contextMenu.paraIndex &&
                b.bookFileId === bookFileId
            ) ?? null
          }
          onAddBookmark={(note) => createBookmark(contextMenu.paraIndex, note)}
          onEditBookmark={(bm) => {
            setEditingBookmark(bm);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      {editingBookmark && (
        <BookmarkEditModal
          bookmark={editingBookmark}
          onSave={(note) => updateBookmark(editingBookmark.id, note)}
          onDelete={() => deleteBookmark(editingBookmark.id)}
          onClose={() => setEditingBookmark(null)}
        />
      )}
    </div>
  );
};

export default Reader;

interface TocSidebarProps {
  open: boolean;
  onClose: () => void;
  tocData: TocData | null;
  currentPartIndex: number;
  onSelectPart: (idx: number) => void;
}

const TocSidebar: React.FC<TocSidebarProps> = ({
  open,
  onClose,
  tocData,
  currentPartIndex,
  onSelectPart,
}) => {
  if (!tocData) return null;

  const renderBodyItems = (items: TocBodyItem[], depth = 0): React.ReactNode =>
    items.map((item, i) => {
      const partIdx = tocData.Parts.findIndex(
        (p) => item.s >= p.s && item.s <= p.e
      );
      const isActive = partIdx === currentPartIndex;
      return (
        <div key={i}>
          <button
            className={`${styles['toc-item']} ${isActive ? styles['toc-item-active'] : ''}`}
            style={{ paddingLeft: `${16 + depth * 16}px` }}
            onClick={() => partIdx !== -1 && onSelectPart(partIdx)}
          >
            {item.t}
          </button>
          {item.c && item.c.length > 0 && renderBodyItems(item.c, depth + 1)}
        </div>
      );
    });

  return createPortal(
    <>
      <div
        className={`${styles['toc-overlay']} ${open ? styles['toc-overlay-open'] : ''}`}
        onClick={onClose}
      />
      <aside
        className={`${styles['toc-sidebar']} ${open ? styles['toc-sidebar-open'] : ''}`}
        aria-label="Содержание"
        role="navigation"
      >
        <div className={styles['toc-header']}>
          <span className={styles['toc-title']}>Содержание</span>
          <button
            className={styles['footnote-close']}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        {tocData.Meta.Title && (
          <div className={styles['toc-book-title']}>{tocData.Meta.Title}</div>
        )}
        <div className={styles['toc-list']}>
          {tocData.Body.length > 0
            ? renderBodyItems(tocData.Body)
            : tocData.Parts.map((part, idx) => (
                <button
                  key={idx}
                  className={`${styles['toc-item']} ${idx === currentPartIndex ? styles['toc-item-active'] : ''}`}
                  style={{ paddingLeft: 16 }}
                  onClick={() => onSelectPart(idx)}
                >
                  {part.url}
                </button>
              ))}
        </div>
      </aside>
    </>,
    document.body
  );
};

interface FootnoteModalProps {
  note: Note | null;
  onClose: () => void;
}

const FootnoteModal: React.FC<FootnoteModalProps> = ({ note, onClose }) => {
  if (!note) return null;
  const footnoteText = note.f
    ? Array.isArray(note.f.c)
      ? note.f.c.join('\n\n')
      : note.f.c
    : '';
  return createPortal(
    <div className={styles['footnote-overlay']} onClick={onClose}>
      <div
        className={styles['footnote-modal']}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          className={styles['footnote-close']}
          onClick={onClose}
          aria-label="Закрыть"
        >
          ✕
        </button>
        <div className={styles['footnote-content']}>
          <span className={styles['footnote-label']}>{note.c}</span>
          <p>{footnoteText}</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface ColorModalProps {
  open: boolean;
  onClose: () => void;
  textColor: string;
  pageColor: string;
  bgColor: string;
  onTextColor: (c: string) => void;
  onPageColor: (c: string) => void;
  onBgColor: (c: string) => void;
}

const ColorSwatch: React.FC<{
  color: string;
  selected: boolean;
  onSelect: () => void;
  dark?: boolean;
}> = ({ color, selected, onSelect, dark }) => (
  <button
    onClick={onSelect}
    aria-label={color}
    style={{
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: color,
      border: selected
        ? `3px solid ${dark ? '#fff' : '#1a1a1a'}`
        : '2px solid #ccc',
      outline: selected ? `2px solid ${color}` : 'none',
      outlineOffset: 2,
      cursor: 'pointer',
      padding: 0,
      flexShrink: 0,
      transition: 'transform 0.1s',
      transform: selected ? 'scale(1.18)' : 'scale(1)',
      boxShadow: selected
        ? '0 0 0 2px rgba(0,0,0,0.18)'
        : '0 1px 3px rgba(0,0,0,0.12)',
    }}
  />
);

const ColorModal: React.FC<ColorModalProps> = ({
  open,
  onClose,
  textColor,
  pageColor,
  bgColor,
  onTextColor,
  onPageColor,
  onBgColor,
}) => {
  if (!open) return null;
  const rows = [
    {
      label: 'Цвет текста',
      colors: TEXT_COLORS,
      value: textColor,
      onChange: onTextColor,
    },
    {
      label: 'Цвет страницы',
      colors: PAGE_COLORS,
      value: pageColor,
      onChange: onPageColor,
    },
    {
      label: 'Цвет фона',
      colors: BG_COLORS,
      value: bgColor,
      onChange: onBgColor,
    },
  ];
  return createPortal(
    <div className={styles['color-overlay']} onClick={onClose}>
      <div
        className={styles['color-modal']}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Настройка цветов"
      >
        <div className={styles['color-modal-header']}>
          <span className={styles['color-modal-title']}>Цвета оформления</span>
          <button
            className={styles['footnote-close']}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className={styles['color-modal-body']}>
          {rows.map((row) => (
            <div key={row.label} className={styles['color-row']}>
              <span className={styles['color-row-label']}>{row.label}</span>
              <div className={styles['color-swatches']}>
                {row.colors.map((c) => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    selected={row.value === c}
                    onSelect={() => row.onChange(c)}
                    dark={row.label === 'Цвет текста'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

interface ContextMenuProps {
  x: number;
  y: number;
  paraIndex: number;
  existingBookmark: Bookmark | null;
  onAddBookmark: (note: string) => void;
  onEditBookmark: (bm: Bookmark) => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  existingBookmark,
  onAddBookmark,
  onEditBookmark,
  onClose,
}) => {
  const [phase, setPhase] = useState<'menu' | 'add'>('menu');
  const [note, setNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (phase === 'add') setTimeout(() => textareaRef.current?.focus(), 30);
  }, [phase]);

  // Позиционирование — не вылезать за правый/нижний край
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 260),
    top: Math.min(y, window.innerHeight - 200),
    zIndex: 4000,
  };

  return createPortal(
    <div data-ctx-menu="true" className={styles['ctx-menu']} style={style}>
      {phase === 'menu' ? (
        <>
          {existingBookmark ? (
            <button
              className={styles['ctx-item']}
              onClick={() => {
                onEditBookmark(existingBookmark);
                onClose();
              }}
            >
              🔖 Редактировать закладку
            </button>
          ) : (
            <button
              className={styles['ctx-item']}
              onClick={() => setPhase('add')}
            >
              🔖 Добавить закладку
            </button>
          )}
          <button
            className={`${styles['ctx-item']} ${styles['ctx-item-cancel']}`}
            onClick={onClose}
          >
            Отмена
          </button>
        </>
      ) : (
        <div className={styles['ctx-add-form']}>
          <div className={styles['ctx-add-label']}>Заметка к закладке</div>
          <textarea
            ref={textareaRef}
            className={styles['ctx-add-textarea']}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Необязательно…"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                onAddBookmark(note.trim());
              }
              if (e.key === 'Escape') onClose();
            }}
          />
          <div className={styles['ctx-add-actions']}>
            <button className={styles['ctx-cancel-btn']} onClick={onClose}>
              Отмена
            </button>
            <button
              className={styles['ctx-confirm-btn']}
              onClick={() => onAddBookmark(note.trim())}
            >
              Добавить
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

// ─── BookmarkEditModal ────────────────────────────────────
// Модалка редактирования/удаления закладки

interface BookmarkEditModalProps {
  bookmark: Bookmark;
  onSave: (note: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

const BookmarkEditModal: React.FC<BookmarkEditModalProps> = ({
  bookmark,
  onSave,
  onDelete,
  onClose,
}) => {
  const [note, setNote] = useState(bookmark.note);
  useEffect(() => setNote(bookmark.note), [bookmark.id]); // eslint-disable-line

  return createPortal(
    <div className={styles['footnote-overlay']} onClick={onClose}>
      <div
        className={styles['bm-edit-modal']}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles['bm-edit-header']}>
          <span className={styles['bm-edit-title']}>🔖 Закладка</span>
          <button className={styles['footnote-close']} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles['bm-edit-section']}>
          <span className={styles['bm-edit-label']}>Заметка</span>
          <textarea
            className={styles['bm-edit-textarea']}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Добавьте заметку…"
            rows={4}
            autoFocus
          />
        </div>

        <div className={styles['bm-edit-position']}>
          Абзац №{bookmark.paraIndex} ·{' '}
          {new Date(bookmark.createdAt).toLocaleString('ru', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        <div className={styles['bm-edit-actions']}>
          <button className={styles['bm-delete-btn']} onClick={onDelete}>
            Удалить
          </button>
          <button
            className={styles['bm-save-btn']}
            onClick={() => {
              onSave(note.trim());
              onClose();
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── BookmarkPanel ────────────────────────────────────────
// Правая боковая панель со списком закладок

interface BookmarkPanelProps {
  open: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onEdit: (bm: Bookmark) => void;
  onDelete: (id: number) => void;
  onNavigate: (bm: Bookmark) => void;
}

const BookmarkPanel: React.FC<BookmarkPanelProps> = ({
  open,
  onClose,
  bookmarks,
  onEdit,
  onDelete,
  onNavigate,
}) =>
  createPortal(
    <>
      <div
        className={`${styles['toc-overlay']} ${open ? styles['toc-overlay-open'] : ''}`}
        onClick={onClose}
      />
      <aside
        className={`${styles['toc-sidebar']} ${styles['bm-sidebar']} ${open ? styles['toc-sidebar-open'] : ''}`}
        aria-label="Закладки"
        role="complementary"
      >
        <div className={styles['toc-header']}>
          <span className={styles['toc-title']}>
            Закладки ({bookmarks.length})
          </span>
          <button
            className={styles['footnote-close']}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {bookmarks.length === 0 ? (
          <div className={styles['bm-empty']}>
            Правый клик на абзаце,
            <br />
            чтобы поставить закладку
          </div>
        ) : (
          <div className={styles['toc-list']}>
            {[...bookmarks]
              .sort((a, b) => a.paraIndex - b.paraIndex)
              .map((bm) => (
                <div key={bm.id} className={styles['bm-item']}>
                  <div className={styles['bm-item-icon']}>🔖</div>
                  <div className={styles['bm-item-body']}>
                    <div
                      className={styles['bm-item-title']}
                      onClick={() => onNavigate(bm)}
                      title="Перейти к закладке"
                    >
                      Абзац №{bm.paraIndex}
                    </div>
                    {bm.note && (
                      <div className={styles['bm-item-note']}>{bm.note}</div>
                    )}
                    <div className={styles['bm-item-meta']}>
                      {new Date(bm.createdAt).toLocaleString('ru', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className={styles['bm-item-actions']}>
                      <button
                        className={styles['bm-item-btn']}
                        onClick={() => onEdit(bm)}
                      >
                        ✏️ Изменить
                      </button>
                      <button
                        className={styles['bm-item-btn']}
                        onClick={() => onDelete(bm.id)}
                      >
                        🗑 Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </aside>
    </>,
    document.body
  );

// ─── ImageLightbox ────────────────────────────────────────

interface ImageLightboxProps {
  src: string | null;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, onClose }) => {
  if (!src) return null;
  return createPortal(
    <div
      className={styles['lightbox-overlay']}
      onClick={onClose}
      role="button"
      aria-label="Закрыть изображение"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <img
        src={src}
        alt=""
        className={styles['lightbox-img']}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
};
