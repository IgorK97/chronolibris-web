// ============================================================
// Reader.tsx — компонент чтения книги на CSS columns
// ============================================================
import { createPortal } from 'react-dom';
// import {
//   useReadingProgress,
//   useUpsertReadingProgress,
// } from '@/api/readingProgress';
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
  PencilLine,
  TableOfContents,
  Trash2,
  X,
} from 'lucide-react';
import type { Bookmark as BookmarkDetails } from '@/types';

import type { CreateBookmarkRequest } from '@/types';
import {
  // bookmarksApi,
  useBookmarks,
  useCreateBookmark,
  useUpdateBookmark,
  useDeleteBookmark,
} from '@/api/bookmarks';
import { useStore } from '@/stores/globalStore';
import { formatDate } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReaderSettings } from './UseReaderSettings';
import { Badge } from '../../../components/ui/badge';

export interface PageNumberNode {
  pn: number;
}

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

export type InlineNode = Note | { t: 'em' | 'st'; c: string } | PageNumberNode;

export interface ImgNode {
  t: 'img';
  src: string;
}

export interface TextSegment {
  t: string;
  xp?: number[];
  c: string | TextSegment[] | (string | InlineNode)[] | ImgNode[]; //широкий юнион
}

export interface TocPart {
  s: number;
  e: number;
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
  full_length: number;
  Body: TocBodyItem[];
  Parts: TocPart[];
}

interface ReaderProps {
  bookFileId: number;
  initialChunkIndex?: number;
  onBack?: () => void;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'none';

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

const TEXT_COLORS = ['#2c2c2c', '#3b2e1e', '#c8bfb0'];
const PAGE_COLORS = ['#faf8f4', '#f4ede0', '#1e1c18'];
const BG_COLORS = ['#e8e4dc', '#d9cdb8', '#131210'];
const fetchToc = async (bookFileId: number): Promise<TocData> => {
  const res = await fetch(`/api/books/files/${bookFileId}/toc`);
  if (!res.ok) throw new Error('Failed to fetch TOC');
  return res.json();
};
const fetchChunk = async (
  bookFileId: number,
  chunkIndex: string
): Promise<TextSegment[]> => {
  const res = await fetch(
    `/api/books/files/${bookFileId}/chunks/${chunkIndex}`
  );
  if (!res.ok) throw new Error('Ошибка загрузки фрагмента');
  return res.json();
};

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

  const { user } = useStore();

  const { data: bookmarks = [], isLoading: bookmarksLoading } = useBookmarks(
    bookFileId ?? null,
    user?.userName ?? null
  );
  // const upsertProgress = useUpsertReadingProgress();
  const progressLoaded = useRef(false);
  console.log(bookmarks);
  const savedPercentRef = useRef<number>(0);
  // const { data: savedProgress } = useReadingProgress(bookFileId);
  // useEffect(() => {
  //   if (savedProgress !== undefined) {
  //     savedPercentRef.current = savedProgress?.percentage ?? 0;
  //     progressLoaded.current = true;
  //   }
  // }, [savedProgress]);

  const createBookmarkMutation = useCreateBookmark(user?.userName ?? '');
  const updateBookmarkMutation = useUpdateBookmark();
  const deleteBookmarkMutation = useDeleteBookmark();

  // const [bookmarks, setBookmarks] = useState<BookmarkDetails[]>([]);
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState<boolean>(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const pageGap = 40;

  //Индекс первого видимого на странице параграфа до изменений
  const visibleParaIndexRef = useRef<number | null>(null);
  //Флаг того, что после изменения нужно восстановить позицию по элементу
  const restoreByElementRef = useRef<boolean>(false);

  const [editingBookmark, setEditingBookmark] =
    useState<BookmarkDetails | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    paraIndex: number;
    x: number;
    y: number;
  } | null>(null);

  const { data: fetchedTocData } = useQuery<TocData, Error>({
    queryKey: ['toc', bookFileId],
    queryFn: () => fetchToc(bookFileId),
    staleTime: Infinity,
    gcTime: 20 * 60 * 1000,
    retry: 2,
  });

  // Находит индекс первого параграфа, который полностью виден в текущей вьюпорте
  const captureVisibleParaIndex = useCallback(() => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return null;

    const contentLeft = ct.scrollLeft;
    // const contentRight = contentLeft + ct.clientWidth;
    const paragraphs = ct.querySelectorAll(
      '[data-para-index]'
    ) as NodeListOf<HTMLElement>;

    for (const p of paragraphs) {
      const pLeft = p.offsetLeft;
      // const pRight = pLeft + p.offsetWidth;

      // Проверяем, что параграф полностью внутри видимой области
      // (можно ослабить условие до pLeft >= viewportLeft, если нужно начало параграфа)
      if (pLeft >= contentLeft) {
        return parseInt(p.getAttribute('data-para-index') || '0', 10);
      }
    }
    // Если полностью видимых нет, берем тот, чье начало ближе всего к началу вьюпорта
    const firstVisible = Array.from(paragraphs).find(
      (p) => p.offsetLeft + p.offsetWidth > contentLeft
    );
    return firstVisible
      ? parseInt(firstVisible.getAttribute('data-para-index') || '0', 10)
      : null;
  }, []);

  const readPercent = useMemo<number>(() => {
    if (!fetchedTocData || fetchedTocData.Body[0].e === 0 || totalCols === 0)
      return 0;
    const part = fetchedTocData.Parts[currentPartIndex];
    if (!part) return 0;
    console.log('TOC_END');
    const colRatio = totalCols > 1 ? currentCol / (totalCols - 1) : 1;
    const globalPos = part.s + (part.e - part.s) * colRatio;
    return Math.min(100, (globalPos / fetchedTocData.Body[0].e) * 100);
  }, [fetchedTocData, currentPartIndex, currentCol, totalCols]);

  const readPercentRef = useRef(readPercent);

  // Обновляем ref при каждом изменении — без перезапуска интервала
  useEffect(() => {
    readPercentRef.current = readPercent;
  }, [readPercent]);

  // Интервал создаётся один раз
  // useEffect(() => {
  //   if (!user) return;

  //   const interval = setInterval(
  //     () => {
  //       if (!progressLoaded.current) return;
  //       const paraIndex = captureVisibleParaIndex() ?? 0;
  //       const current = readPercentRef.current;

  //       if (current > savedPercentRef.current) {
  //         savedPercentRef.current = current;
  //         upsertProgress.mutate({
  //           bookFileId,
  //           percentage: current,
  //           paraIndex,
  //         });
  //       }
  //     },
  //     3 * 60 * 1000
  //   );

  //   return () => clearInterval(interval);
  // }, [user, bookFileId]);

  useEffect(() => {
    if (!user) return;

    const handleUnload = () => {
      if (!progressLoaded.current) return;

      const paraIndex = captureVisibleParaIndex() ?? 0;
      if (readPercentRef.current > savedPercentRef.current) {
        fetch('/api/ReadingProgress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookFileId,
            percentage: readPercentRef,
            paraIndex,
          }),
          keepalive: true,
        });
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user, bookFileId, captureVisibleParaIndex]);

  const pendingBookmarkParaRef = useRef<number | null>(null);

  const pendingColRef = useRef<number | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [twoPageMode, setTwoPageMode] = useState(false);
  // useEffect(() => {
  //   setCurrentCol(0);
  // }, [currentPartIndex]);

  const { data: segments, isLoading } = useQuery({
    queryKey: ['chunk', bookFileId, currentPartIndex],
    // queryFn: () =>
    //   fetchChunk(bookFileId, fetchedTocData?.Parts[currentPartIndex].url),
    queryFn: () => {
      // Проверяем, что URL существует (fetchedTocData гарантирован enabled, но url может отсутствовать)
      const url = fetchedTocData?.Parts[currentPartIndex]?.url;
      if (!url) {
        // Если URL нет, отклоняем промис с ошибкой
        return Promise.reject(new Error('URL for chunk not available'));
      }
      return fetchChunk(bookFileId, url);
    },
    enabled: !!fetchedTocData && currentPartIndex < fetchedTocData.Parts.length,
    staleTime: Infinity, // Какова вероятность того,
    // что текст книги изменится во время чтения пользователя?
    gcTime: 10 * 60 * 1000,
  });
  const queryClient = useQueryClient();

  // useEffect(() => {
  //   if (!fetchedTocData || currentPartIndex >= fetchedTocData.Parts.length)
  //     return;

  //   const load = async () => {
  //     setIsLoading(true);
  //     setNextSegments(null);
  //     setCurrentCol(0);

  //     fetchChunk(bookFileId, currentPartIndex)
  //       .then((data: TextSegment[]) => {
  //         setSegments(data);
  //         setIsLoading(false);
  //       })
  //       .catch((err) => {
  //         console.error('Failed to load chunk: ', err);
  //         setIsLoading(false);
  //       });
  //   };

  //   load();
  // }, [bookFileId, currentPartIndex, fetchedTocData]);

  const recalcCols = () => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return;

    const pageWidth = twoPageMode
      ? (ct.clientWidth - pageGap) / 2 + pageGap
      : vp.clientWidth;
    console.log(
      twoPageMode,
      ' ',
      ct.clientWidth,
      ' ',
      (ct.clientWidth - pageGap) / 2
    );
    console.log('PageSize: ', pageWidth);
    const cols = Math.ceil(ct.scrollWidth / pageWidth);
    const newTotal = Math.max(1, cols);
    console.log(newTotal);
    setTotalCols(newTotal);

    if (restoreByElementRef.current && visibleParaIndexRef.current !== null) {
      const targetParaIndex = visibleParaIndexRef.current;
      const targetEl = ct.querySelector(
        `[data-para-index="${targetParaIndex}"]`
      ) as HTMLElement;

      if (targetEl) {
        // Вычисляем новую страницу на основе позиции элемента
        const newCol = Math.floor(targetEl.offsetLeft / pageWidth);
        let target = Math.min(newCol, newTotal - 1);

        if (twoPageMode && target > 0) target = target - (target % 2);

        setCurrentCol(target);
        ct.scrollTo({ left: target * pageWidth, behavior: 'auto' });
      }

      // Сбрасываем флаги
      restoreByElementRef.current = false;
      visibleParaIndexRef.current = null;
      return; //позиция восстановлена
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
  }, []);

  //Подзагрузка следующего фрагмента
  useEffect(() => {
    if (!fetchedTocData || isLoading) return;

    if (totalCols === 0) return;

    const remaining = totalCols - 1 - currentCol;
    if (remaining > PREFETCH_THRESHOLD) return;

    const nextIdx = currentPartIndex + 1;
    if (nextIdx >= fetchedTocData.Parts.length) return;

    queryClient.prefetchQuery({
      queryKey: ['chunk', bookFileId, nextIdx],
      queryFn: () => fetchChunk(bookFileId, fetchedTocData.Parts[nextIdx].url),
    });

    // setIsPrefetching(true);
    // fetchChunk(bookFileId, nextIdx)
    //   .then((data: TextSegment[]) => {
    //     setNextSegments(data);
    //     setIsPrefetching(false);
    //   })
    //   .catch(() => setIsPrefetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!vp || !ct) return;

    const pageWidth = twoPageMode
      ? (ct!.clientWidth - pageGap) / 2 + pageGap
      : vp.clientWidth;
    // console.log(pageWidth);
    if (col >= totalCols && fetchedTocData) {
      const nextIdx = currentPartIndex + 1;
      if (nextIdx < fetchedTocData.Parts.length) {
        setCurrentCol(0);
        pendingColRef.current = 0;
        setCurrentPartIndex(nextIdx);
        // return;
        // if (nextSegments !== null) {
        //   setSegments(nextSegments);
        //   setNextSegments(null);
        //   setCurrentCol(0);
        //   pendingColRef.current = 0;
        // } else {
        //   pendingColRef.current = 0;
        // }
        // setCurrentPartIndex(nextIdx);
        // return;
      }
      return; // -
    }

    if (col < 0 && fetchedTocData) {
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

    // console.log(col, totalCols, leftPos);
    setCurrentCol(clamped);
    ct.scrollTo({ left: leftPos, behavior: 'smooth' });
  };

  useEffect(() => {
    // Если recalcCols требует актуальных размеров DOM, можно использовать
    // requestAnimationFrame или setTimeout 0, чтобы дать браузеру отрисовать.
    // Но чаще всего эффект срабатывает уже после обновления макета.
    const timeoutId = setTimeout(() => {
      recalcCols();
    }, 0); // микро-задержка для гарантии отрисовки

    return () => clearTimeout(timeoutId);
  }, [twoPageMode]); // добавьте сюда другие зависимости, если recalcCols их использует

  // useEffect(() => {
  //   // setCurrentCol(0);
  //   // contentRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  // }, [twoPageMode]);

  const nextCol = () => goToCol(currentCol + (twoPageMode ? 2 : 1));
  const prevCol = () => goToCol(currentCol - (twoPageMode ? 2 : 1));

  const changeFontSize = useCallback(
    (delta: number) => {
      // 1. Запоминаем, какой элемент сейчас видит пользователь
      const visiblePara = captureVisibleParaIndex();
      if (visiblePara !== null) {
        visibleParaIndexRef.current = visiblePara;
        restoreByElementRef.current = true;
      }
      setFontSize(
        Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, fontSize + delta))
      );
      // setFontSize((p) =>
      //   Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, p + delta))
      // );
      // setFontSize((p) =>
      //   Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, p + delta))
      // );
      // setCurrentCol(0);
      // viewportRef.current?.scrollTo({ left: 0, behavior: 'auto' });
    },
    [fontSize]
  );

  const changeFontFamily = useCallback((value: string) => {
    // 1. Запоминаем, какой элемент сейчас видит пользователь
    const visiblePara = captureVisibleParaIndex();
    if (visiblePara !== null) {
      visibleParaIndexRef.current = visiblePara;
      restoreByElementRef.current = true;
    }

    setFontFamily(value);
    // setFontFamily(value);
    // setCurrentCol(0);
    // viewportRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, []);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fetchedTocData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    const targetGlobal = Math.round(ratio * fetchedTocData.Body[0].e); // 0-based

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
      // Другой фрагмент: сохраняем ratio, меняем фрагмент
      pendingColRef.current = -withinRatio;
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
    (paraIndex: number, note: string) => {
      if (!bookFileId || !user) return;

      const request: CreateBookmarkRequest = {
        bookFileId: bookFileId,
        paraIndex,
        noteText: note.trim() || undefined,
      };

      createBookmarkMutation.mutate(request);
      setContextMenu(null);
    },
    [bookFileId, user, createBookmarkMutation]
  );

  const updateBookmark = useCallback(
    (id: number, bookFileId: number, note?: string) => {
      updateBookmarkMutation.mutate({
        id,
        data: { note: note?.trim() || undefined },
        bookFileId,
      });
      setEditingBookmark(null);
    },
    [updateBookmarkMutation]
  );

  const deleteBookmark = useCallback(
    (id: number, bookFileId: number) => {
      deleteBookmarkMutation.mutate({ id, bookFileId });
      setEditingBookmark(null);
    },
    [deleteBookmarkMutation]
  );

  const navigateToBookmark = useCallback(
    (bm: BookmarkDetails) => {
      if (!fetchedTocData) return;
      const globalIdx = bm.paraIndex; //-1
      const partIdx = fetchedTocData.Parts.findIndex(
        (p) => globalIdx >= p.s && globalIdx <= p.e
      );
      if (partIdx === -1) return;
      setBookmarkPanelOpen(false);

      const scrollToParaInDOM = (paraIdx: number) => {
        const el = contentRef.current?.querySelector(
          `[data-para-index="${paraIdx}"]`
        ) as HTMLElement | null;
        if (!el || !viewportRef.current) return false;

        const ctRect = contentRef.current!.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const elLeft =
          elRect.left - ctRect.left + contentRef.current!.scrollLeft;
        const colWidth = twoPageMode
          ? (contentRef.current!.clientWidth - pageGap) / 2 + pageGap
          : viewportRef.current.clientWidth;
        const targetCol = Math.max(0, Math.floor(elLeft / colWidth));

        if (targetCol !== currentCol) {
          setCurrentCol(targetCol);
          contentRef.current!.scrollTo({
            // left: targetCol * (contentRef.current!.clientWidth - pageGap),
            left: targetCol * colWidth,
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
    [fetchedTocData, currentPartIndex, currentCol, twoPageMode]
  );

  useEffect(() => {
    if (pendingBookmarkParaRef.current === null) return;
    if (isLoading || totalCols === 0) return;
    const paraIdx = pendingBookmarkParaRef.current;
    pendingBookmarkParaRef.current = null;
    // На всякий случай задержку поставил, устал уже от всего
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
        ? (contentRef.current!.clientWidth - pageGap) / 2 + pageGap
        : viewportRef.current.clientWidth;
      const targetCol = Math.max(0, Math.floor(elLeft / colWidth));
      setCurrentCol(targetCol);
      contentRef.current!.scrollTo({
        // left: targetCol * (contentRef.current!.clientWidth - pageGap),
        left: targetCol * colWidth,
        behavior: 'smooth',
      });
    }, 80);
  }, [isLoading, totalCols, segments, twoPageMode]);

  const renderInlineContent = useCallback(
    (content: (string | InlineNode)[]): React.ReactNode => {
      return content.map((item, idx) => {
        if (typeof item === 'string')
          return <React.Fragment key={idx}>{item}</React.Fragment>;
        if (typeof item === 'object' && 'pn' in item) {
          return (
            // <span key={idx} className={styles['page-num']}>
            //   {(item as PageNumberNode).pn}
            // </span>
            <Badge key={idx} variant="outline" className={styles['page-num']}>
              {(item as PageNumberNode).pn}
            </Badge>
          );
        }
        //Почему-то пока не добавил обработку сверху, выдавал ошибку,
        //что такого свойства нет в InlineNode (PageNumberNode)
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
    if (seg.t === 'pn') {
      return (
        <div key={index} className={styles['page-num-block']}>
          <Badge variant="outline" className={styles['page-num']}>
            {seg.c as unknown as number}
          </Badge>
        </div>

        // <div key={index} className={styles['page-num-block']}>
        //   <span className={styles['page-num']}>
        //     {seg.c as unknown as number}
        //   </span>
        // </div>
      );
    }
    if (seg.t === 'img') {
      const imgNodes = Array.isArray(seg.c) ? seg.c : [];
      const firstImg = imgNodes.find(
        (n) => typeof n !== 'string' && (n as ImgNode).t === 'img'
      ) as ImgNode | undefined;
      if (!firstImg) return null;
      const fullUrl = `${import.meta.env.VITE_STORAGE_URL}/images/${bookFileId}/${firstImg.src}`;
      // const fullUrl = imagePath
      //   ? `${imagePath.replace(/\/$/, '')}/${firstImg.src}`
      //   : firstImg.src;
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
    console.log(paraIndex, bookFileId);
    console.log(bookmarks[0]);
    const paraBookmark =
      bookmarks.find((bm) => {
        return bm.paraIndex === paraIndex && bm.bookFileId === bookFileId;
      }) ?? null;
    console.log(paraBookmark);
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
        <Bookmark color="red" />
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

  if (isLoading || !fetchedTocData || !segments || segments.length === 0) {
    return (
      <div className={styles['loading']}>
        {/* <div className={styles['spinner']} />
         */}
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
        currentPartIndex={currentPartIndex}
        onSelectPart={(idx) => {
          pendingColRef.current = 0;
          setCurrentPartIndex(idx);
          setTocOpen(false);
        }}
      />

      <div
        className={`${styles['toolbar']} ${toolbarCollapsed ? styles['toolbar-collapsed'] : ''}`}
        style={{ background: pageColor }}
      >
        <button
          className={styles['toolbar-toggle']}
          onClick={() => setToolbarCollapsed((v) => !v)}
          aria-label={
            toolbarCollapsed ? 'Развернуть панель' : 'Свернуть панель'
          }
          title={toolbarCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
        >
          {toolbarCollapsed ? <ChevronDown /> : <ChevronUp />}
        </button>
        <div className={styles['toolbar-inner']}>
          <div className={styles['controls']}>
            {onBack && (
              <button onClick={onBack} className={styles['nav-button']}>
                <ChevronLeft /> Вернуться к книге
              </button>
            )}
            {fetchedTocData && (
              <button
                onClick={() => setTocOpen((v) => !v)}
                className={`${styles['nav-button']} ${tocOpen ? styles['nav-button-active'] : ''}`}
                aria-label="Содержание"
              >
                <TableOfContents /> Содержание
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
              {/* {`Стр. ${currentCol + 1} / ${totalCols}`} */}
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
              <Palette color="red" />
            </button>
            {user?.role == 'reader' && (
              <button
                onClick={() => setBookmarkPanelOpen((v) => !v)}
                className={`${styles['color-button']} ${bookmarkPanelOpen ? styles['nav-button-active'] : ''}`}
                aria-label="Закладки"
                title={`Закладки (${bookmarks.filter((b) => b.bookFileId === bookFileId).length})`}
              >
                <Bookmark color="red" />{' '}
                {bookmarks.filter((b) => b.bookFileId === bookFileId).length > 0
                  ? bookmarks.filter((b) => b.bookFileId === bookFileId).length
                  : ''}
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
          {/* Строка 1 */}
          <div
            className={styles['pad-top']}
            style={{ background: pageColor }}
          />

          {/* Строка 2 */}
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
              {segments.map((seg, idx) => renderSegment(seg, idx))}
            </div>
          </div>
          <div
            className={[styles['pad-right'], styles['nav-pad']].join(' ')}
            style={{ background: pageColor }}
            onClick={nextCol}
          />

          {/* Строка 3 */}
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
        onTextColor={setTextColor}
        onPageColor={setPageColor}
        onBgColor={setBgColor}
      />
      <BookmarkPanel
        open={bookmarkPanelOpen}
        onClose={() => setBookmarkPanelOpen(false)}
        bookmarks={bookmarks.filter((b) => b.bookFileId === bookFileId)}
        onEdit={setEditingBookmark}
        isLoading={bookmarksLoading}
        onDelete={(id: number) => deleteBookmark(id, bookFileId)}
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
  /*What is that? <> */
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
            <X />
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
  textColor: string;
  pageColor: string;
  fontFamily: string;
}

const FootnoteModal: React.FC<FootnoteModalProps> = ({
  note,
  onClose,
  textColor,
  pageColor,
  fontFamily,
}) => {
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
        style={{ background: pageColor, color: textColor, fontFamily }}
      >
        <button
          className={styles['footnote-close']}
          onClick={onClose}
          aria-label="Закрыть"
          style={{ color: textColor }}
        >
          <X />
        </button>
        <div className={styles['footnote-content']}>
          <span
            className={styles['footnote-label']}
            style={{ color: textColor }}
          >
            {note.c}
          </span>
          <p style={{ color: textColor }}>{footnoteText}</p>
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
  existingBookmark: BookmarkDetails | null;
  onAddBookmark: (note: string) => void;
  onEditBookmark: (bm: BookmarkDetails) => void;
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
              <Bookmark color="red" /> Редактировать закладку
            </button>
          ) : (
            <button
              className={styles['ctx-item']}
              onClick={() => setPhase('add')}
            >
              <Bookmark color="red" /> Добавить закладку
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

interface BookmarkEditModalProps {
  bookmark: BookmarkDetails;
  onSave: (note?: string) => void;
  onDelete: (id: number) => void;
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
          <span className={styles['bm-edit-title']}>
            <Bookmark color="red" /> Закладка
          </span>
          <button className={styles['footnote-close']} onClick={onClose}>
            <X />
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
          Абзац №{bookmark.paraIndex} {formatDate(bookmark.createdAt)}
        </div>

        <div className={styles['bm-edit-actions']}>
          <button
            className={styles['bm-delete-btn']}
            onClick={() => onDelete(bookmark.id)}
          >
            Удалить
          </button>
          <button
            className={styles['bm-save-btn']}
            onClick={() => {
              onSave(note?.trim());
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

interface BookmarkPanelProps {
  open: boolean;
  onClose: () => void;
  bookmarks: BookmarkDetails[];
  isLoading?: boolean;
  onEdit: (bm: BookmarkDetails) => void;
  onDelete: (id: number) => void;
  onNavigate: (bm: BookmarkDetails) => void;
}

const BookmarkPanel: React.FC<BookmarkPanelProps> = ({
  open,
  onClose,
  bookmarks,
  isLoading,
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
          isLoading ? (
            <div className={styles['bm-empty']}>Загрузка закладок...</div>
          ) : (
            <div className={styles['bm-empty']}>
              Правый клик на абзаце,
              <br />
              чтобы поставить закладку
            </div>
          )
        ) : (
          <div className={styles['toc-list']}>
            {[...bookmarks]
              .sort((a, b) => a.paraIndex - b.paraIndex)
              .map((bm) => (
                <div key={bm.id} className={styles['bm-item']}>
                  <div className={styles['bm-item-icon']}>
                    <Bookmark color="red" />
                  </div>
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
                    {/* {(() => {
                      console.log('bm keys:', Object.keys(bm));
                      console.log('bm full:', bm);
                      console.log(bm.createdAt);
                      return null;
                    })()} */}
                    <div className={styles['bm-item-meta']}>
                      {formatDate(bm.createdAt)}

                      {/* {new Date(bm['createdAt']).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })} */}
                    </div>
                    <div className={styles['bm-item-actions']}>
                      <button
                        className={styles['bm-item-btn']}
                        onClick={() => onEdit(bm)}
                      >
                        <PencilLine /> Изменить
                      </button>
                      <button
                        className={styles['bm-item-btn']}
                        onClick={() => onDelete(bm.id)}
                      >
                        <Trash2 /> Удалить
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
