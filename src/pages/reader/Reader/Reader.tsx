/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { Puff } from 'react-loading-icons';
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import styles from './Reader.module.css';
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Palette,
  // PencilLine,
  TableOfContents,
  // Trash2,
} from 'lucide-react';
import type {
  Bookmark as BookmarkDetails,
  ImgNode,
  InlineNode,
  Note,
  PageNumberNode,
  TextSegment,
  // TocBodyItem,
  // TocData,
} from '@/types';

import type { CreateBookmarkRequest } from '@/types';
import {
  // bookmarksApi,
  useBookmarks,
  useCreateBookmark,
  useUpdateBookmark,
  useDeleteBookmark,
} from '@/api/bookmarks';
import { useStore } from '@/stores/globalStore';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReaderSettings } from './UseReaderSettings';
import { Badge } from '../../../components/ui/badge';
import { prefetchBookChunk, useBookChunk, useBookToc } from '@/api/books';
import { BookmarkPanel } from './BookmarkPanel';
import { TocSidebar } from './TocSidebar';
import { FootnoteModal } from './FootnoteModal';
import {
  BG_COLORS,
  FONT_OPTIONS,
  PAGE_COLORS,
  TEXT_COLORS,
} from '@/utils/readerOpts';
import { ColorModal } from './ColorModal';
import { ContextMenu } from './ContextMenu';
import { ImageLightbox } from './ImageLightbox';
import { BookmarkEditModal } from './BookmarkEditModal';
import { extractContext } from './utils';

interface ReaderProps {
  bookFileId: number;
  initialChunkIndex?: number;
  onBack?: () => void;
}

const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;
const PREFETCH_THRESHOLD = 3;

export const Reader: React.FC<ReaderProps> = ({
  bookFileId,
  initialChunkIndex = 0,
  onBack,
}) => {
  const [currentPartIndex, setCurrentPartIndex] = useState(initialChunkIndex);

  const {
    settings: { fontSize, fontFamily, textColor, pageColor, bgColor },
    setFontSize,
    setFontFamily,
    setTextColor,
    setPageColor,
    setBgColor,
  } = useReaderSettings({
    defaults: {
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: FONT_OPTIONS[0].value,
      textColor: TEXT_COLORS[0],
      pageColor: PAGE_COLORS[0],
      bgColor: BG_COLORS[0],
    },
  });

  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [currentCol, setCurrentCol] = useState(0);
  const [totalCols, setTotalCols] = useState(0);

  const { user, pendingBookmarkNav, setPendingBookmarkNav } = useStore();

  const { data: bookmarks = [], isLoading: bookmarksLoading } = useBookmarks(
    bookFileId ?? null,
    user?.userName ?? null
  );
  // console.log(bookmarks);

  const createBookmarkMutation = useCreateBookmark(user?.userName ?? '');
  const updateBookmarkMutation = useUpdateBookmark();
  const deleteBookmarkMutation = useDeleteBookmark();

  // const [bookmarks, setBookmarks] = useState<BookmarkDetails[]>([]);
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState<boolean>(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const pageGap = 40;

  //Индекс первого видимого на странице параграфа до изменений
  const visibleParaIndexRef = useRef<string | null>(null);
  //восстановление по элементу или нет
  const restoreByElementRef = useRef<boolean>(false);

  const [editingBookmark, setEditingBookmark] =
    useState<BookmarkDetails | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    xpointer: string;
    context: string;
    x: number;
    y: number;
  } | null>(null);

  const {
    data: fetchedTocData,
    isError: isTocError,
    refetch: refetchToc,
  } = useBookToc(bookFileId);
  //Индекс Part, в диапазон которого попадает xpointer закладки
  const findPartByXpointer = useCallback(
    (xpointer: string): number => {
      if (!fetchedTocData) return -1;
      const xp = parseXpointer(xpointer);
      return fetchedTocData.Parts.findIndex(
        (p) => compareXp(xp, p.xps) >= 0 && compareXp(xp, p.xpe) <= 0
      );
    },
    [fetchedTocData]
  );

  useEffect(() => {
    if (
      !pendingBookmarkNav ||
      !fetchedTocData ||
      pendingBookmarkNav.bookFileId !== bookFileId
    ) {
      return;
    }

    const targetXp = pendingBookmarkNav.xpointer;

    const partIdx = findPartByXpointer(targetXp);

    if (partIdx !== -1) {
      setPendingBookmarkNav(null);

      if (partIdx === currentPartIndex) {
        setTimeout(() => scrollToXpInDOM(targetXp), 200);
      } else {
        pendingBookmarkXpRef.current = targetXp;
        setCurrentPartIndex(partIdx);
      }
    }
  }, [
    pendingBookmarkNav,
    fetchedTocData,
    bookFileId,
    currentPartIndex,
    findPartByXpointer,
    setPendingBookmarkNav,
  ]);

  // useEffect(() => {
  //   console.log('TOC DATA: ', fetchedTocData);
  // }, [fetchedTocData]);

  //функция для определения индекса первого параграфа, который полностью виден на странице
  const captureVisibleParaIndex = useCallback(() => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return null;

    const contentLeft = ct.scrollLeft;
    // const contentRight = contentLeft + ct.clientWidth;
    const paragraphs = ct.querySelectorAll(
      '[data-xpointer]'
    ) as NodeListOf<HTMLElement>;

    for (const p of paragraphs) {
      const pLeft = p.offsetLeft;
      // const pRight = pLeft + p.offsetWidth;

      //параграф полностью внутри видимой области
      if (pLeft >= contentLeft) {
        return p.getAttribute('data-xpointer') || '/1';
      }
    }
    //Если полностью видимых нет, нужен тот, чье начало ближе всего к началу вьюпорта
    const firstVisible = [...paragraphs].find(
      (p) => p.offsetLeft + p.offsetWidth > contentLeft
    );
    return firstVisible
      ? firstVisible.getAttribute('data-xpointer') || '/1'
      : null;
  }, []);

  const readPercent = useMemo<number>(() => {
    if (!fetchedTocData || fetchedTocData.Body[0].e === 0 || totalCols === 0)
      return 0;
    const part = fetchedTocData.Parts[currentPartIndex];
    if (!part) return 0;
    // console.log('TOC_END');
    const colRatio = totalCols > 1 ? currentCol / (totalCols - 1) : 1;
    const globalPos = part.s + (part.e - part.s) * colRatio;
    return Math.min(100, (globalPos / fetchedTocData.Body[0].e) * 100);
  }, [fetchedTocData, currentPartIndex, currentCol, totalCols]);

  // const readPercentRef = useRef(readPercent);

  // useEffect(() => {
  //   readPercentRef.current = readPercent;
  // }, [readPercent]);

  const compareXp = (a: number[], b: number[]): number => {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; //по возрастанию, первым идет а, потом б
    }
    return a.length - b.length;
  };

  //"/1/3/1" - [1, 3, 1]
  const parseXpointer = (xp: string): number[] =>
    xp.split('/').filter(Boolean).map(Number);

  const stringifyXpointer = (path: number[]): string =>
    path.length > 0 ? `/${path.join('/')}` : '/';

  const pendingBookmarkXpRef = useRef<string | null>(null);
  // const pendingBookmarkParaRef = useRef<string | null>(null);

  const pendingColRef = useRef<number | null>(null); //null,9999,+0,-

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [twoPageMode, setTwoPageMode] = useState(false);

  const {
    data: segments,
    isLoading,
    isError: isChunkError,
    refetch: refetchChunk,
  } = useBookChunk(bookFileId, currentPartIndex, fetchedTocData);
  // const queryClient = useQueryClient();

  const recalcCols = () => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return;

    const pageWidth = twoPageMode
      ? (ct.clientWidth - pageGap) / 2 + pageGap
      : vp.clientWidth;
    const cols = Math.ceil(ct.scrollWidth / pageWidth);
    const newTotal = Math.max(1, cols);
    // console.log(newTotal);
    setTotalCols(newTotal);

    if (restoreByElementRef.current && visibleParaIndexRef.current !== null) {
      const targetParaIndex = visibleParaIndexRef.current;
      const targetEl = ct.querySelector(
        `[data-xpointer="${targetParaIndex}"]`
      ) as HTMLElement;

      if (targetEl) {
        //новую страницу на основе позиции элемента
        const newCol = Math.floor(targetEl.offsetLeft / pageWidth);
        let target = Math.min(newCol, newTotal - 1);

        if (twoPageMode && target > 0) target = target - (target % 2);

        setCurrentCol(target);
        ct.scrollTo({ left: target * pageWidth, behavior: 'auto' });
      }

      restoreByElementRef.current = false;
      visibleParaIndexRef.current = null;
      return;
    }

    if (pendingColRef.current !== null) {
      let target: number;
      const pending = pendingColRef.current;
      if (pending === 9999) {
        target = newTotal - 1;
      } else if (pending < 0) {
        target = Math.round(-pending * (newTotal - 1));
      } else {
        target = Math.min(pending, newTotal - 1);
      }
      if (twoPageMode && target > 0) target = target - (target % 2);
      pendingColRef.current = null;
      setCurrentCol(target);
      ct.scrollTo({
        // left: target * ct.clientWidth,
        left: target * pageWidth,
        behavior: 'auto',
      });
    }
  };
  useEffect(() => {
    if (!isLoading) {
      recalcCols();
      // const id = setTimeout(recalcCols, 50);
      // return () => clearTimeout(id);
    }
  }, [isLoading, fontSize, fontFamily, segments]);
  useEffect(() => {
    window.addEventListener('resize', recalcCols);
    return () => window.removeEventListener('resize', recalcCols);
  }, [twoPageMode]);

  useEffect(() => {
    if (isLoading || totalCols === 0) return;
    if (pendingBookmarkXpRef.current === null) return;
    const xp = pendingBookmarkXpRef.current;
    pendingBookmarkXpRef.current = null;
    setTimeout(() => scrollToXpInDOM(xp), 100);
  }, [isLoading, totalCols, segments]);

  useEffect(() => {
    if (fetchedTocData) {
      document.title = `${fetchedTocData.Meta.Title} — Читать онлайн`;
    }

    // return () => { document.title = 'Chronolibris'; };
  }, [fetchedTocData]);

  //Подзагрузка следующего фрагмента
  useEffect(() => {
    if (!fetchedTocData || isLoading) return;

    if (totalCols === 0) return;

    const remaining = totalCols - currentCol;
    if (remaining > PREFETCH_THRESHOLD) return;

    const nextIdx = currentPartIndex + 1;
    if (nextIdx >= fetchedTocData.Parts.length) return;
    // console.log(fetchedTocData);
    prefetchBookChunk(bookFileId, nextIdx, fetchedTocData);
  }, [
    bookFileId,
    currentCol,
    totalCols,
    fetchedTocData,
    currentPartIndex,
    isLoading,
  ]);

  const goToCol = (col: number) => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    // console.log('PUM');
    if (!vp || !ct || !fetchedTocData) return;
    // console.log('I AM HERE');

    const pageWidth = twoPageMode
      ? (ct!.clientWidth - pageGap) / 2 + pageGap
      : vp.clientWidth;
    // console.log(pageWidth);
    if (col >= totalCols) {
      const nextIdx = currentPartIndex + 1;
      if (nextIdx < fetchedTocData.Parts.length) {
        setCurrentCol(0);
        pendingColRef.current = 0;
        setCurrentPartIndex(nextIdx);
      }
      return; // -
    }
    if (col < 0) {
      const prevIdx = currentPartIndex - 1;
      if (prevIdx >= 0) {
        pendingColRef.current = 9999;
        setCurrentPartIndex(prevIdx);
        // return;
      }
      return;
    }

    // let targetCol = Math.max(0, Math.min(col, totalCols - 1));
    let targetCol = col;
    //В режиме двух страниц всегда отображается левая страница разворота (округление вниз до четного числа)
    if (twoPageMode && targetCol > 0) targetCol = targetCol - (targetCol % 2);
    const leftPos = targetCol * pageWidth;

    console.log(col, totalCols, leftPos);
    setCurrentCol(targetCol);
    ct.scrollTo({ left: leftPos, behavior: 'smooth' });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      recalcCols();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [twoPageMode]);

  const nextCol = () => goToCol(currentCol + (twoPageMode ? 2 : 1));
  const prevCol = () => goToCol(currentCol - (twoPageMode ? 2 : 1));

  const changeFontSize = useCallback(
    (delta: number) => {
      const visiblePara = captureVisibleParaIndex();
      if (visiblePara !== null) {
        visibleParaIndexRef.current = visiblePara;
        restoreByElementRef.current = true;
      }
      setFontSize(
        Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, fontSize + delta))
      );
    },
    [fontSize]
  );

  const changeFontFamily = useCallback((value: string) => {
    const visiblePara = captureVisibleParaIndex();
    if (visiblePara !== null) {
      visibleParaIndexRef.current = visiblePara;
      restoreByElementRef.current = true;
    }

    setFontFamily(value);
  }, []);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fetchedTocData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    const targetGlobal = Math.round(ratio * fetchedTocData.Body[0].e);

    const partIdx = fetchedTocData.Parts.findIndex(
      (p) => targetGlobal >= p.s && targetGlobal <= p.e
    );
    if (partIdx === -1) return;

    const part = fetchedTocData.Parts[partIdx];
    const withinRatio = (targetGlobal - part.s) / Math.max(1, part.e - part.s);

    if (partIdx === currentPartIndex) {
      let targetCol = Math.round(withinRatio * (totalCols - 1));
      if (twoPageMode && targetCol > 0) targetCol = targetCol - (targetCol % 2);
      goToCol(targetCol);
    } else {
      pendingColRef.current = -withinRatio; //вместо индекса страницы процент
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

  const createBookmark = useCallback(
    async (xpointer: string, context: string, note: string) => {
      if (!bookFileId || !user) return;

      const request: CreateBookmarkRequest = {
        bookFileId: bookFileId,
        xpointer,
        context,
        noteText: note.trim() || undefined,
      };

      await createBookmarkMutation.mutateAsync(request);
      setContextMenu(null);
    },
    [bookFileId, user, createBookmarkMutation]
  );

  const updateBookmark = useCallback(
    async (id: number, bookFileId: number, note?: string) => {
      if (!bookFileId || !user) return;

      await updateBookmarkMutation.mutateAsync({
        id,
        data: { note: note?.trim() || undefined },
        bookFileId,
      });
      setEditingBookmark(null);
    },
    [updateBookmarkMutation]
  );

  const deleteBookmark = useCallback(
    async (id: number, bookFileId: number) => {
      if (!bookFileId || !user) return;

      await deleteBookmarkMutation.mutateAsync({ id, bookFileId });
      setEditingBookmark(null);
    },
    [deleteBookmarkMutation]
  );

  const scrollToXpInDOM = useCallback(
    (xpointer: string): boolean => {
      if (!contentRef.current || !viewportRef.current) return false;

      const el = contentRef.current.querySelector(
        `[data-xpointer="${xpointer}"]`
      ) as HTMLElement | null;
      if (!el || !viewportRef.current) return false;

      const ctRect = contentRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elLeft = elRect.left - ctRect.left + contentRef.current.scrollLeft;
      const colWidth = twoPageMode
        ? (contentRef.current.clientWidth - pageGap) / 2 + pageGap
        : viewportRef.current.clientWidth;
      const targetCol = Math.max(0, Math.floor(elLeft / colWidth));

      if (targetCol !== currentCol) {
        setCurrentCol(targetCol);
        contentRef.current.scrollTo({
          left: targetCol * colWidth,
          behavior: 'smooth',
        });
      }
      return true;
    },
    [twoPageMode, currentCol]
  );

  const navigateToBookmark = useCallback(
    (bm: BookmarkDetails) => {
      if (!fetchedTocData || !bm.xpointer) return;
      const partIdx = findPartByXpointer(bm.xpointer);
      if (partIdx === -1) return;
      setBookmarkPanelOpen(false);

      if (partIdx === currentPartIndex) {
        setTimeout(() => scrollToXpInDOM(bm.xpointer), 50);
      } else {
        pendingBookmarkXpRef.current = bm.xpointer;
        setCurrentPartIndex(partIdx);
      }
    },
    [fetchedTocData, findPartByXpointer, currentPartIndex, scrollToXpInDOM]
  );

  const renderInlineContent = useCallback(
    (content: (string | InlineNode)[]): React.ReactNode => {
      return content.map((item, idx) => {
        if (typeof item === 'string') return <span key={idx}>{item}</span>;
        if ('pn' in item) {
          return (
            <Badge key={idx} variant="outline" className={styles['page-num']}>
              {item.pn}
            </Badge>
          );
        }
        if (item.t === 'em') return <em key={idx}>{item.c}</em>;
        if (item.t === 'st') return <strong key={idx}>{item.c}</strong>;
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') setActiveNote(note);
              }}
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
    if ('pn' in seg) {
      return (
        <div key={index} className={styles['page-num-block']}>
          <Badge variant="outline" className={styles['page-num']}>
            {seg.pn as number}
          </Badge>
        </div>
      );
    }
    if (seg.t === 'img') {
      const imgNodes = Array.isArray(seg.c) ? seg.c : [];
      const firstImg = imgNodes.find(
        (n) => typeof n !== 'string' && (n as ImgNode).t === 'img'
      ) as ImgNode | undefined;
      if (!firstImg) return null;
      const fullUrl = `${import.meta.env.VITE_API_URL}/books/images/${bookFileId}/${firstImg.src}`;
      return (
        <div key={index} className={styles['img-block']}>
          <img
            src={fullUrl}
            className={styles['img-inline']}
            onClick={() => setActiveImage(fullUrl)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setActiveImage(fullUrl);
            }}
          />
        </div>
      );
    }

    const segXpointer = seg.xp ? '/' + seg.xp.join('/') : '';
    // console.log(paraIndex, bookFileId);
    // console.log(bookmarks[0]);
    const paraBookmark =
      (bookmarks || []).find((bm) => {
        return bm.xpointer === segXpointer && bm.bookFileId === bookFileId;
      }) ?? null;
    // console.log(paraBookmark);
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
      if (user?.role !== 'reader') return;
      setContextMenu({
        xpointer: segXpointer,
        x: e.clientX,
        y: e.clientY,
        context: extractContext(seg),
      });
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
        <Bookmark color="red" />
      </span>
    ) : null;

    if (seg.t === 'title') {
      return (
        <h2
          key={index}
          className={styles['title']}
          style={textStyle}
          // data-para-index={String(paraIndex)}
          data-xpointer={segXpointer}
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
        // data-para-index={String(paraIndex)}
        data-xpointer={segXpointer}
        onContextMenu={handleContextMenu}
      >
        {bookmarkIcon}
        {getContent()}
      </p>
    );
  };

  if (isTocError && !fetchedTocData) {
    return (
      <div className={styles['loading']}>
        <p>
          Ошибка загрузки книги.{' '}
          <button
            style={{ cursor: 'pointer', color: '#f55a42' }}
            onClick={() => refetchToc()}
          >
            Попробовать снова
          </button>
        </p>
      </div>
    );
  }

  if (!fetchedTocData) {
    return (
      <div className={styles['loading']}>
        <Puff stroke="#f55a42" strokeOpacity={0.5} speed={0.75} />
        <p>Загрузка книги...</p>
      </div>
    );
  }

  const hasPrev = currentCol > 0 || currentPartIndex > 0;
  const hasNext = fetchedTocData
    ? currentCol < totalCols - 1 ||
      currentPartIndex < fetchedTocData.Parts.length - 1
    : currentCol < totalCols - 1;

  return (
    <div className={styles['reader']} style={{ background: bgColor }}>
      <TocSidebar
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        tocData={fetchedTocData}
        textColor={textColor}
        pageColor={pageColor}
        bgColor={bgColor}
        currentPartIndex={currentPartIndex}
        onSelectPart={(idx, xps) => {
          const xp = stringifyXpointer(xps ?? []);
          setTocOpen(false);

          if (idx === currentPartIndex) {
            //тот же фрагмент — сразу скролл
            if (xp) setTimeout(() => scrollToXpInDOM(xp), 50);
          } else {
            //другой фрагмент - сменить фрагмент
            if (xp) {
              pendingBookmarkXpRef.current = xp;
            } else {
              pendingColRef.current = 0; //без xp — просто на начало
            }
            setCurrentPartIndex(idx);
          }
        }}
      />

      <div
        className={`${styles['toolbar']} ${toolbarCollapsed ? styles['toolbar-collapsed'] : ''}`}
        style={{ background: pageColor }}
      >
        <button
          className={styles['toolbar-toggle']}
          onClick={() => setToolbarCollapsed((v) => !v)}
          title={toolbarCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
        >
          {toolbarCollapsed ? <ChevronDown /> : <ChevronUp />}
        </button>
        <div className={styles['toolbar-inner']}>
          <div className={styles['controls']}>
            {onBack && (
              <button
                className={styles['font-button']}
                onClick={() => window.history.back()}
              >
                <ChevronLeft size={20} />
                <span>Назад к описанию</span>
              </button>
            )}
            {fetchedTocData && (
              <button
                className={styles['font-button']}
                onClick={() => setTocOpen(true)}
              >
                <TableOfContents size={20} />
                <span className={styles['toc']}>Содержание</span>
              </button>
            )}
            <button
              onClick={() => {
                const visiblePara = captureVisibleParaIndex();
                if (visiblePara !== null) {
                  visibleParaIndexRef.current = visiblePara;
                  restoreByElementRef.current = true;
                }
                setTwoPageMode((v) => !v);
              }}
              className={styles['nav-button']}
            >
              {twoPageMode ? '1 страница' : '2 страницы'}
            </button>
            <button
              onClick={prevCol}
              disabled={!hasPrev}
              className={styles['nav-button']}
            >
              <ChevronLeft /> Назад
            </button>
            <span className={styles['page-info']}>
              {twoPageMode
                ? `Стр. ${Math.min(currentCol + 2, totalCols)} / ${totalCols}`
                : `Стр. ${currentCol + 1} / ${totalCols}`}
              {fetchedTocData && (
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
              Вперёд <ChevronRight />
            </button>
          </div>

          <div className={styles['settings']}>
            <select
              className={styles['font-select']}
              value={fontFamily}
              onChange={(e) => changeFontFamily(e.target.value)}
              title="Выбор шрифта"
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
              title="Цвета"
            >
              <Palette color="red" />
            </button>
            {user?.role == 'reader' && (
              <button
                onClick={() => setBookmarkPanelOpen((v) => !v)}
                className={`${styles['color-button']} ${bookmarkPanelOpen ? styles['nav-button-active'] : ''}`}
                title={`Закладки (${(bookmarks || []).filter((b) => b.bookFileId === bookFileId).length})`}
              >
                <Bookmark color="red" />{' '}
              </button>
            )}
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

      <div className={styles['reading-container']}>
        <div
          className={
            twoPageMode ? styles['reading-area-two'] : styles['reading-area']
          }
        >
          <div
            className={styles['pad-top']}
            style={{ background: pageColor }}
          />

          <div
            className={[styles['pad-left'], styles['nav-pad']].join(' ')}
            style={{ background: pageColor }}
            onClick={prevCol}
          />
          <div
            className={styles['book-viewport']}
            ref={viewportRef}
            style={{ background: pageColor }}
          >
            <div
              className={
                twoPageMode
                  ? styles['book-content-two']
                  : styles['book-content']
              }
              ref={contentRef}
            >
              {isLoading ? (
                <div className={styles['chunk-loader']}>
                  <Puff stroke="#f55a42" size={40} />
                  <p>Загрузка фрагмента...</p>
                </div>
              ) : isChunkError ? (
                <div className={styles['chunk-error']}>
                  <p>Не удалось загрузить эту часть текста.</p>
                  <button
                    onClick={() => refetchChunk()}
                    className={styles['nav-button']}
                  >
                    Повторить загрузку
                  </button>
                </div>
              ) : (
                //если все хорошо, то рендер сегментов
                segments?.map((seg, idx) => renderSegment(seg, idx))
              )}
            </div>
          </div>
          <div
            className={[styles['pad-right'], styles['nav-pad']].join(' ')}
            style={{ background: pageColor }}
            onClick={nextCol}
          />

          <div
            className={styles['pad-bottom']}
            style={{ background: pageColor }}
          />
        </div>
      </div>

      <div
        className={styles['progress-bar']}
        onClick={handleProgressClick}
        role="slider"
        title={`${readPercent.toFixed(0)}% прочитано`}
      >
        <div
          className={styles['progress-fill']}
          style={{ width: `${readPercent}%` }}
        />
      </div>

      <FootnoteModal
        note={activeNote}
        onClose={() => setActiveNote(null)}
        textColor={textColor}
        fontFamily={fontFamily}
        pageColor={pageColor}
      />
      <ImageLightbox src={activeImage} onClose={() => setActiveImage(null)} />
      <ColorModal
        open={colorModalOpen}
        onClose={() => setColorModalOpen(false)}
        textColor={textColor}
        pageColor={pageColor}
        bgColor={bgColor}
        onApplyTheme={(theme: { text: string; page: string; bg: string }) => {
          if (theme.text) setTextColor(theme.text);
          if (theme.page) setPageColor(theme.page);
          if (theme.bg) setBgColor(theme.bg);
        }}
        // onTextColor={setTextColor}
        // onPageColor={setPageColor}
        // onBgColor={setBgColor}
      />
      <BookmarkPanel
        open={bookmarkPanelOpen}
        onClose={() => setBookmarkPanelOpen(false)}
        bookmarks={(bookmarks || []).filter((b) => b.bookFileId === bookFileId)}
        onEdit={setEditingBookmark}
        isLoading={bookmarksLoading}
        onDelete={(id: number) => deleteBookmark(id, bookFileId)}
        onNavigate={navigateToBookmark}
        textColor={textColor}
        pageColor={pageColor}
        bgColor={bgColor}
      />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          xpointer={contextMenu.xpointer}
          existingBookmark={
            (bookmarks || []).find(
              (b) =>
                b.xpointer === contextMenu.xpointer &&
                b.bookFileId === bookFileId
            ) ?? null
          }
          onAddBookmark={(note) =>
            createBookmark(contextMenu.xpointer, contextMenu.context, note)
          }
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
          onSave={(note) =>
            updateBookmark(editingBookmark.id, bookFileId, note)
          }
          onDelete={(id: number) => deleteBookmark(id, bookFileId)}
          onClose={() => setEditingBookmark(null)}
        />
      )}
    </div>
  );
};

export default Reader;
