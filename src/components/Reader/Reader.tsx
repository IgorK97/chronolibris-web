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

// ─── Типы ────────────────────────────────────────────────────

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

// ─── Пропсы ──────────────────────────────────────────────────

interface ReaderProps {
  tocPath?: string;
  /** базовый путь для URL фрагментов, напр. '/data/' */
  basePath?: string;
  /** начальный файл, если нет toc */
  filePath?: string;
  imagePath?: string;
}

// ─── Константы ───────────────────────────────────────────────

const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;
/** За сколько страниц до конца начинаем подгружать следующий фрагмент */
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

// ─── Компонент ───────────────────────────────────────────────

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

  const [currentCol, setCurrentCol] = useState(0);
  const [totalCols, setTotalCols] = useState(0);

  // pendingCol: число ≥ 0 — конкретная колонка,
  //             число < 0 — ratio внутри фрагмента (умножить на totalCols),
  //             9999 — последняя страница
  const pendingColRef = useRef<number | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ─── Загрузка toc ─────────────────────────────────────────

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

  // ─── URL текущего фрагмента ───────────────────────────────

  const currentUrl = useMemo(() => {
    if (tocData) {
      const part = tocData.Parts[currentPartIndex];
      if (part) return buildUrl(basePath, part.url);
    }
    return filePath ?? '';
  }, [tocData, currentPartIndex, basePath, filePath]);

  // ─── Загрузка фрагмента при смене currentUrl ──────────────

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

  // ─── Подсчёт колонок + обработка pending ──────────────────

  const recalcCols = useCallback(() => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return;
    const cols = Math.round(ct.scrollWidth / vp.clientWidth);
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
      pendingColRef.current = null;
      setCurrentCol(target);
      vp.scrollTo({ left: target * (vp.clientWidth - 40), behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const id = setTimeout(recalcCols, 50);
      return () => clearTimeout(id);
    }
  }, [isLoading, fontSize, fontFamily, segments, recalcCols]);

  useEffect(() => {
    window.addEventListener('resize', recalcCols);
    return () => window.removeEventListener('resize', recalcCols);
  }, [recalcCols]);

  // ─── Предзагрузка следующего фрагмента ───────────────────

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

  // ─── Навигация ────────────────────────────────────────────

  const goToCol = useCallback(
    (col: number) => {
      const vp = viewportRef.current;
      if (!vp) return;

      // Вперёд за пределы фрагмента
      if (col >= totalCols && tocData) {
        const nextIdx = currentPartIndex + 1;
        if (nextIdx < tocData.Parts.length) {
          if (nextSegments !== null) {
            // Мгновенное переключение на предзагруженный фрагмент
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

      // Назад за пределы фрагмента
      if (col < 0 && tocData) {
        const prevIdx = currentPartIndex - 1;
        if (prevIdx >= 0) {
          pendingColRef.current = 9999;
          setCurrentPartIndex(prevIdx);
          return;
        }
        return;
      }

      const clamped = Math.max(0, Math.min(col, totalCols - 1));
      setCurrentCol(clamped);
      vp.scrollTo({
        left: clamped * (vp.clientWidth - 40),
        behavior: 'smooth',
      });
    },
    [totalCols, tocData, currentPartIndex, nextSegments]
  );

  const nextCol = useCallback(
    () => goToCol(currentCol + 1),
    [currentCol, goToCol]
  );
  const prevCol = useCallback(
    () => goToCol(currentCol - 1),
    [currentCol, goToCol]
  );

  // ─── Размер и гарнитура ───────────────────────────────────

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

  // ─── Клавиатура ───────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveNote(null);
        setActiveImage(null);
        setTocOpen(false);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') nextCol();
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevCol();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextCol, prevCol]);

  // ─── Прогресс чтения (сквозная нумерация) ────────────────
  //
  // toc хранит: full_length — общее число абзацев (1-based, т.е. абзацы 0..full_length-1).
  // Каждый Part: s и e — 0-based глобальные индексы первого и последнего абзаца.
  // xp[2] в сегментах — 1-based сквозной номер абзаца.
  // Текущая позиция: интерполируем между s и e по прогрессу колонок.

  const readPercent = useMemo<number>(() => {
    if (!tocData || tocData.full_length === 0 || totalCols === 0) return 0;
    const part = tocData.Parts[currentPartIndex];
    if (!part) return 0;

    const colRatio = totalCols > 1 ? currentCol / (totalCols - 1) : 1;
    const globalPos = part.s + (part.e - part.s) * colRatio; // 0-based
    return Math.min(100, (globalPos / (tocData.full_length - 1)) * 100);
  }, [tocData, currentPartIndex, currentCol, totalCols]);

  // ─── Клик по прогресс-бару ────────────────────────────────

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tocData) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const targetGlobal = Math.round(ratio * (tocData.full_length - 1)); // 0-based

      const partIdx = tocData.Parts.findIndex(
        (p) => targetGlobal >= p.s && targetGlobal <= p.e
      );
      if (partIdx === -1) return;

      const part = tocData.Parts[partIdx];
      const withinRatio =
        (targetGlobal - part.s) / Math.max(1, part.e - part.s);

      if (partIdx === currentPartIndex) {
        // Тот же фрагмент
        const targetCol = Math.round(withinRatio * (totalCols - 1));
        goToCol(targetCol);
      } else {
        // Другой фрагмент: сохраняем ratio, меняем фрагмент
        pendingColRef.current = -withinRatio; // отрицательное = ratio mode
        setCurrentPartIndex(partIdx);
      }
    },
    [tocData, currentPartIndex, totalCols, goToCol]
  );

  // ─── renderInlineContent ─────────────────────────────────

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

  // ─── renderSegment ────────────────────────────────────────

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

    if (seg.t === 'title') {
      return (
        <h2 key={index} className={styles['title']} style={textStyle}>
          {getContent()}
        </h2>
      );
    }
    return (
      <p key={index} className={styles['paragraph']} style={textStyle}>
        {getContent()}
      </p>
    );
  };

  // ─── Рендер ───────────────────────────────────────────────

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

      {/* Тулбар */}
      <div className={styles['toolbar']}>
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
            {`Стр. ${currentCol + 1} / ${totalCols}`}
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

      {/* Область чтения */}
      <div className={styles['reading-area']}>
        <div
          className={styles['book-viewport']}
          ref={viewportRef}
          style={{ background: pageColor }}
        >
          <div className={styles['book-content']} ref={contentRef}>
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
        {/* Маркеры границ фрагментов */}
        {tocData &&
          tocData.Parts.map((part, i) => {
            if (i === 0) return null;
            const pct = (part.s / (tocData.full_length - 1)) * 100;
            return (
              <div
                key={i}
                className={styles['progress-marker']}
                style={{ left: `${pct}%` }}
              />
            );
          })}
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
    </div>
  );
};

export default Reader;

// ─── TocSidebar ───────────────────────────────────────────

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

// ─── FootnoteModal ────────────────────────────────────────

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

// ─── ColorModal ───────────────────────────────────────────

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

// // ============================================================
// // Reader.tsx — компонент чтения книги на CSS columns
// // Весь текст фрагмента рендерится в один контейнер с
// // column-count: 1 и фиксированной высотой. Браузер сам
// // раскладывает контент по «страницам»-колонкам.
// // Навигация — scrollTo на ширину viewport программно.
// // ============================================================
// import { createPortal } from 'react-dom';
// import React, {
//   useState,
//   useEffect,
//   useCallback,
//   useRef,
//   useMemo,
// } from 'react';
// import styles from './Reader.module.css';

// export interface Footnote {
//   t: string;
//   xp: number[];
//   c: string | string[];
// }

// export interface Note {
//   t: string;
//   role: string;
//   xp: number[];
//   c: string;
//   f?: Footnote;
// }

// export type InlineNode = Note | { t: 'em' | 'st'; c: string };

// export interface ImgNode {
//   t: 'img';
//   src: string;
// }

// export interface TextSegment {
//   t: string;
//   xp?: number[];
//   c: string | TextSegment[] | (string | InlineNode)[] | ImgNode[];
// }

// export interface TocPart {
//   s: number; // глобальный 0-based индекс первого абзаца фрагмента
//   e: number; // глобальный 0-based индекс последнего абзаца фрагмента
//   xps: number[];
//   xpe: number[];
//   url: string;
// }

// export interface TocBodyItem {
//   s: number;
//   e: number;
//   t: string;
//   c?: TocBodyItem[];
// }

// export interface TocMeta {
//   Title: string;
//   Authors: { Role: string; First?: string; Last?: string }[];
//   Annotation: string;
//   Lang: string;
// }

// export interface TocData {
//   Meta: TocMeta;
//   full_length: number; // общее число абзацев в книге (1-based, т.е. абзацы 1..full_length)
//   Body: TocBodyItem[];
//   Parts: TocPart[];
// }

// // export interface TocPart {
// //   s: number;
// //   e: number;
// //   xps: number[];
// //   xpe: number[];
// //   url: string;
// // }

// // export interface TocMeta {
// //   Title: string;
// //   Authors: { Role: string; First: string; Last: string }[];
// //   Annotation: string;
// //   Lang: string;
// // }

// // export interface TocData {
// //   Meta: TocMeta;
// //   full_length: number;
// //   Body: unknown[];
// //   Parts: TocPart[];
// // }

// interface ReaderProps {
//   /** базовый путь для URL фрагментов, напр. '/data/' */
//   basePath?: string;
//   tocPath?: string;
//   filePath?: string;
//   imagePath?: string;
// }

// const DEFAULT_FONT_SIZE = 18;
// const MIN_FONT_SIZE = 12;
// const MAX_FONT_SIZE = 32;

// const FONT_OPTIONS: { label: string; value: string }[] = [
//   { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
//   { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
//   { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
//   { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
//   { label: 'Courier New', value: "'Courier New', Courier, monospace" },
//   { label: 'Palatino', value: "'Palatino Linotype', Palatino, serif" },
//   { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
// ];

// const TEXT_COLORS = ['#1a1a1a', '#3b2a1a', '#1a2e1a', '#0d1b2a', '#4a4a4a'];
// const PAGE_COLORS = ['#ffffff', '#f5f1e8', '#f0ede0', '#e8f0e8', '#e8eef5'];
// const BG_COLORS = ['#f5f1e8', '#e8e0d0', '#d6cfc0', '#dde8dd', '#d0dce8'];

// function buildUrl(base: string | undefined, url: string): string {
//   if (!base) return url;
//   return base.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
// }

// export const Reader: React.FC<ReaderProps> = ({
//   basePath,
//   tocPath,
//   filePath = '/data/002.js',
//   imagePath,
// }) => {
//   const [segments, setSegments] = useState<TextSegment[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
//   const [activeNote, setActiveNote] = useState<Note | null>(null);
//   const [activeImage, setActiveImage] = useState<string | null>(null);
//   const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
//   const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
//   const [pageColor, setPageColor] = useState(PAGE_COLORS[0]);
//   const [bgColor, setBgColor] = useState(BG_COLORS[0]);
//   const [colorModalOpen, setColorModalOpen] = useState(false);
//   // Текущая «страница» = индекс колонки (0-based)
//   const [currentCol, setCurrentCol] = useState(0);
//   // Общее число колонок — вычисляется после рендера по scrollWidth
//   const [totalCols, setTotalCols] = useState(0);

//   const [tocData, setTocData] = useState<TocData | null>(null);
//   const [currentPartIndex, setCurrentPartIndex] = useState(0);
//   const [nextSegments, setNextSegments] = useState<TextSegment[] | null>(null);
//   const [isPrefetching, setIsPrefetching] = useState(false);
//   // viewport — внешний контейнер с overflow-x: hidden (скролл только программный)
//   const viewportRef = useRef<HTMLDivElement>(null);
//   // content — колоночный контейнер
//   const contentRef = useRef<HTMLDivElement>(null);

//   // ─── Загрузка toc ─────────────────────────────────────────

//   useEffect(() => {
//     if (!tocPath) return;
//     fetch(tocPath)
//       .then((r) => r.json())
//       .then((data: TocData) => {
//         setTocData(data);
//         const idx = data.Parts.findIndex((p) => filePath.endsWith(p.url));
//         if (idx !== -1) setCurrentPartIndex(idx);
//       })
//       .catch(console.error);
//   }, [tocPath, filePath]);

//   const currentUrl = useMemo(() => {
//     if (tocData) {
//       const part = tocData.Parts[currentPartIndex];
//       if (part) return buildUrl(basePath, part.url);
//     }
//     return filePath ?? '';
//   }, [tocData, currentPartIndex, basePath, filePath]);

//   // ─── Загрузка фрагмента ────────────────────────────────────

//   // useEffect(() => {
//   //   const load = async () => {
//   //     setIsLoading(true);
//   //     setCurrentCol(0);
//   //     fetch(filePath)
//   //       .then((r) => r.json())
//   //       .then((data: TextSegment[]) => {
//   //         setSegments(data);
//   //         setIsLoading(false);
//   //       })
//   //       .catch(() => setIsLoading(false));
//   //   };
//   //   load();
//   // }, [filePath]);

//   useEffect(() => {
//     if (!currentUrl) return;
//     const load = async () => {
//       setIsLoading(true);
//       setNextSegments(null);
//       setCurrentCol(0);
//       fetch(currentUrl)
//         .then((r) => r.json())
//         .then((data: TextSegment[]) => {
//           setSegments(data);
//           setIsLoading(false);
//         })
//         .catch(() => setIsLoading(false));
//     };
//     load();
//   }, [currentUrl]);

//   // ─── Подсчёт колонок ──────────────────────────────────────
//   // scrollWidth всего book-content / clientWidth одного viewport = число колонок.
//   // Вызывается после рендера и при ресайзе.

//   const recalcCols = useCallback(() => {
//     const vp = viewportRef.current;
//     const ct = contentRef.current;
//     if (!vp || !ct) return;
//     const cols = Math.round(ct.scrollWidth / vp.clientWidth);
//     setTotalCols(Math.max(1, cols));
//   }, []);

//   useEffect(() => {
//     if (!isLoading) {
//       // Задержка 50ms — браузер должен завершить layout колонок
//       const id = setTimeout(recalcCols, 50);
//       return () => clearTimeout(id);
//     }
//   }, [isLoading, fontSize, fontFamily, recalcCols]);

//   useEffect(() => {
//     window.addEventListener('resize', recalcCols);
//     return () => window.removeEventListener('resize', recalcCols);
//   }, [recalcCols]);

//   // ─── Навигация по колонкам ────────────────────────────────

//   const goToCol = useCallback(
//     (col: number) => {
//       const vp = viewportRef.current;
//       if (!vp) return;
//       const clamped = Math.max(0, Math.min(col, totalCols - 1));
//       setCurrentCol(clamped);
//       // Программный скролл: каждая «страница» = clientWidth viewport
//       vp.scrollTo({
//         left: clamped * (vp.clientWidth - 40),
//         behavior: 'smooth',
//       });
//     },
//     [totalCols]
//   );

//   const nextCol = useCallback(
//     () => goToCol(currentCol + 1),
//     [currentCol, goToCol]
//   );
//   const prevCol = useCallback(
//     () => goToCol(currentCol - 1),
//     [currentCol, goToCol]
//   );

//   // ─── Смена шрифта — сброс на первую колонку ───────────────

//   const changeFontSize = useCallback((delta: number) => {
//     setFontSize((prev) =>
//       Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, prev + delta))
//     );
//     setCurrentCol(0);
//     viewportRef.current?.scrollTo({ left: 0, behavior: 'auto' });
//   }, []);

//   const changeFontFamily = useCallback((value: string) => {
//     setFontFamily(value);
//     setCurrentCol(0);
//     viewportRef.current?.scrollTo({ left: 0, behavior: 'auto' });
//   }, []);

//   // ─── Клавиатура ───────────────────────────────────────────

//   useEffect(() => {
//     const handleKey = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') {
//         setActiveNote(null);
//         setActiveImage(null);
//         return;
//       }
//       if (e.key === 'ArrowRight' || e.key === 'PageDown') nextCol();
//       else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevCol();
//     };
//     window.addEventListener('keydown', handleKey);
//     return () => window.removeEventListener('keydown', handleKey);
//   }, [nextCol, prevCol]);

//   // ─── Прогресс чтения ─────────────────────────────────────

//   const readPercent = useMemo<number>(() => {
//     if (totalCols === 0) return 0;
//     if (!tocData || tocData.Parts.length === 0) {
//       return ((currentCol + 1) / totalCols) * 100;
//     }
//     const part = tocData.Parts[currentPartIndex];
//     if (!part) return 0;
//     const partLength = part.e - part.s + 1;
//     const progressInPart = (currentCol + 1) / totalCols;
//     const globalPos = part.s + partLength * progressInPart;
//     return Math.min(100, (globalPos / tocData.full_length) * 100);
//   }, [tocData, currentPartIndex, currentCol, totalCols]);

//   // ─── renderInlineContent ─────────────────────────────────

//   const renderInlineContent = useCallback(
//     (content: (string | InlineNode)[]): React.ReactNode => {
//       return content.map((item, idx) => {
//         if (typeof item === 'string')
//           return <React.Fragment key={idx}>{item}</React.Fragment>;
//         if (item.t === 'em')
//           return <em key={idx}>{(item as { t: string; c: string }).c}</em>;
//         if (item.t === 'st')
//           return (
//             <strong key={idx}>{(item as { t: string; c: string }).c}</strong>
//           );
//         if (item.t === 'note') {
//           const note = item as Note;
//           return (
//             <span
//               key={idx}
//               className={styles['note-ref']}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setActiveNote(note);
//               }}
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => e.key === 'Enter' && setActiveNote(note)}
//             >
//               {note.c}
//             </span>
//           );
//         }
//         return null;
//       });
//     },
//     []
//   );

//   // ─── renderSegment ────────────────────────────────────────
//   // Рендерит один TextSegment напрямую, без пагинации.
//   // Браузер сам раскладывает контент по колонкам.

//   const renderSegment = (seg: TextSegment, index: number): React.ReactNode => {
//     if (seg.t === 'br') return <br key={index} />;

//     // Изображение
//     if (seg.t === 'img') {
//       const imgNodes = Array.isArray(seg.c) ? seg.c : [];
//       const firstImg = imgNodes.find(
//         (n) => typeof n !== 'string' && (n as ImgNode).t === 'img'
//       ) as ImgNode | undefined;
//       if (!firstImg) return null;
//       const fullUrl = imagePath
//         ? `${imagePath.replace(/\/$/, '')}/${firstImg.src}`
//         : firstImg.src;
//       return (
//         <div key={index} className={styles['img-block']}>
//           <img
//             src={fullUrl}
//             alt=""
//             className={styles['img-inline']}
//             onClick={() => setActiveImage(fullUrl)}
//             role="button"
//             tabIndex={0}
//             onKeyDown={(e) => e.key === 'Enter' && setActiveImage(fullUrl)}
//           />
//         </div>
//       );
//     }

//     // Вычисляем inline-содержимое
//     const getContent = (): React.ReactNode => {
//       if (typeof seg.c === 'string') return seg.c;
//       if (Array.isArray(seg.c)) {
//         return renderInlineContent(
//           seg.c.map((item) =>
//             typeof item === 'string' ? item : (item as InlineNode)
//           )
//         );
//       }
//       return null;
//     };

//     if (seg.t === 'title') {
//       return (
//         <h2
//           key={index}
//           className={styles['title']}
//           style={{ fontSize: `${fontSize}px`, fontFamily, color: textColor }}
//         >
//           {getContent()}
//         </h2>
//       );
//     }

//     return (
//       <p
//         key={index}
//         className={styles['paragraph']}
//         style={{ fontSize: `${fontSize}px`, fontFamily, color: textColor }}
//       >
//         {getContent()}
//       </p>
//     );
//   };
//   // [imagePath, renderInlineContent]
//   if (isLoading) {
//     return (
//       <div className={styles['loading']}>
//         <div className={styles['spinner']} />
//         <p>Загрузка книги...</p>
//       </div>
//     );
//   }

//   return (
//     <div className={styles['reader']} style={{ background: bgColor }}>
//       {/* Тулбар */}
//       <div className={styles['toolbar']}>
//         <div className={styles['controls']}>
//           <button
//             onClick={prevCol}
//             disabled={currentCol <= 0}
//             className={styles['nav-button']}
//           >
//             ← Назад
//           </button>

//           <span className={styles['page-info']}>
//             {`Стр. ${currentCol + 1} / ${totalCols}`}
//             {tocData && (
//               <span className={styles['read-percent']}>
//                 {' '}
//                 ({readPercent.toFixed(1)}%)
//               </span>
//             )}
//           </span>

//           <button
//             onClick={nextCol}
//             disabled={currentCol >= totalCols - 1}
//             className={styles['nav-button']}
//           >
//             Вперёд →
//           </button>
//         </div>

//         <div className={styles['settings']}>
//           <button
//             onClick={() => setColorModalOpen(true)}
//             className={styles['color-button']}
//             aria-label="Настройка цветов"
//             title="Цвета"
//           >
//             🎨
//           </button>
//           <select
//             className={styles['font-select']}
//             value={fontFamily}
//             onChange={(e) => changeFontFamily(e.target.value)}
//             aria-label="Выбор шрифта"
//           >
//             {FONT_OPTIONS.map((opt) => (
//               <option key={opt.value} value={opt.value}>
//                 {opt.label}
//               </option>
//             ))}
//           </select>
//           <button
//             onClick={() => changeFontSize(-2)}
//             className={styles['font-button']}
//           >
//             A-
//           </button>
//           <span className={styles['font-size']}>{fontSize}px</span>
//           <button
//             onClick={() => changeFontSize(2)}
//             className={styles['font-button']}
//           >
//             A+
//           </button>
//         </div>
//       </div>

//       {/* Область чтения */}
//       <div className={styles['reading-area']}>
//         {/*
//           book-viewport — контейнер с overflow-x: hidden.
//           Пользователь не может скроллить руками — только кнопки/клавиши.
//         */}
//         <div
//           className={styles['book-viewport']}
//           ref={viewportRef}
//           style={{ background: pageColor }}
//         >
//           {/*
//             book-content — колоночный контейнер.
//             CSS: columns: 1; column-fill: auto; height: 100%
//             Ширина колонки = 100% viewport, т.е. одна колонка = одна страница.
//             column-gap создаёт отступ между «страницами» в горизонтальном потоке.
//           */}
//           <div className={styles['book-content']} ref={contentRef}>
//             {segments.map((seg, idx) => renderSegment(seg, idx))}
//           </div>
//         </div>

//         {/* Зоны клика поверх текста */}
//         <div
//           className={styles['prev-zone']}
//           onClick={prevCol}
//           role="button"
//           tabIndex={0}
//           aria-label="Предыдущая страница"
//         />
//         <div
//           className={styles['next-zone']}
//           onClick={nextCol}
//           role="button"
//           tabIndex={0}
//           aria-label="Следующая страница"
//         />
//       </div>

//       {/* Прогресс-бар */}
//       <div className={styles['progress-bar']}>
//         <div
//           className={styles['progress-fill']}
//           style={{ width: `${readPercent}%` }}
//         />
//       </div>

//       <FootnoteModal note={activeNote} onClose={() => setActiveNote(null)} />
//       <ImageLightbox src={activeImage} onClose={() => setActiveImage(null)} />
//       <ColorModal
//         open={colorModalOpen}
//         onClose={() => setColorModalOpen(false)}
//         textColor={textColor}
//         pageColor={pageColor}
//         bgColor={bgColor}
//         onTextColor={setTextColor}
//         onPageColor={setPageColor}
//         onBgColor={setBgColor}
//       />
//     </div>
//   );
// };

// export default Reader;

// interface ColorModalProps {
//   open: boolean;
//   onClose: () => void;
//   textColor: string;
//   pageColor: string;
//   bgColor: string;
//   onTextColor: (c: string) => void;
//   onPageColor: (c: string) => void;
//   onBgColor: (c: string) => void;
// }

// const ColorSwatch: React.FC<{
//   color: string;
//   selected: boolean;
//   onSelect: () => void;
//   dark?: boolean;
// }> = ({ color, selected, onSelect, dark }) => (
//   <button
//     onClick={onSelect}
//     aria-label={color}
//     style={{
//       width: 28,
//       height: 28,
//       borderRadius: '50%',
//       background: color,
//       border: selected
//         ? `3px solid ${dark ? '#fff' : '#1a1a1a'}`
//         : '2px solid #ccc',
//       outline: selected ? `2px solid ${color}` : 'none',
//       outlineOffset: 2,
//       cursor: 'pointer',
//       padding: 0,
//       flexShrink: 0,
//       transition: 'transform 0.1s',
//       transform: selected ? 'scale(1.18)' : 'scale(1)',
//       boxShadow: selected
//         ? '0 0 0 2px rgba(0,0,0,0.18)'
//         : '0 1px 3px rgba(0,0,0,0.12)',
//     }}
//   />
// );

// const ColorModal: React.FC<ColorModalProps> = ({
//   open,
//   onClose,
//   textColor,
//   pageColor,
//   bgColor,
//   onTextColor,
//   onPageColor,
//   onBgColor,
// }) => {
//   if (!open) return null;

//   const rows: {
//     label: string;
//     colors: string[];
//     value: string;
//     onChange: (c: string) => void;
//   }[] = [
//     {
//       label: 'Цвет текста',
//       colors: TEXT_COLORS,
//       value: textColor,
//       onChange: onTextColor,
//     },
//     {
//       label: 'Цвет страницы',
//       colors: PAGE_COLORS,
//       value: pageColor,
//       onChange: onPageColor,
//     },
//     {
//       label: 'Цвет фона',
//       colors: BG_COLORS,
//       value: bgColor,
//       onChange: onBgColor,
//     },
//   ];

//   return createPortal(
//     <div className={styles['color-overlay']} onClick={onClose}>
//       <div
//         className={styles['color-modal']}
//         onClick={(e) => e.stopPropagation()}
//         role="dialog"
//         aria-modal="true"
//         aria-label="Настройка цветов"
//       >
//         <div className={styles['color-modal-header']}>
//           <span className={styles['color-modal-title']}>Цвета оформления</span>
//           <button
//             className={styles['footnote-close']}
//             onClick={onClose}
//             aria-label="Закрыть"
//           >
//             ✕
//           </button>
//         </div>
//         <div className={styles['color-modal-body']}>
//           {rows.map((row) => (
//             <div key={row.label} className={styles['color-row']}>
//               <span className={styles['color-row-label']}>{row.label}</span>
//               <div className={styles['color-swatches']}>
//                 {row.colors.map((c) => (
//                   <ColorSwatch
//                     key={c}
//                     color={c}
//                     selected={row.value === c}
//                     onSelect={() => row.onChange(c)}
//                     dark={row.label === 'Цвет текста'}
//                   />
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>,
//     document.body
//   );
// };

// // ─── FootnoteModal ────────────────────────────────────────

// interface FootnoteModalProps {
//   note: Note | null;
//   onClose: () => void;
// }

// const FootnoteModal: React.FC<FootnoteModalProps> = ({ note, onClose }) => {
//   if (!note) return null;
//   const footnoteText = note.f
//     ? Array.isArray(note.f.c)
//       ? note.f.c.join('\n\n')
//       : note.f.c
//     : '';
//   return createPortal(
//     <div className={styles['footnote-overlay']} onClick={onClose}>
//       <div
//         className={styles['footnote-modal']}
//         onClick={(e) => e.stopPropagation()}
//         role="dialog"
//         aria-modal="true"
//       >
//         <button
//           className={styles['footnote-close']}
//           onClick={onClose}
//           aria-label="Закрыть"
//         >
//           ✕
//         </button>
//         <div className={styles['footnote-content']}>
//           <span className={styles['footnote-label']}>{note.c}</span>
//           <p>{footnoteText}</p>
//         </div>
//       </div>
//     </div>,
//     document.body
//   );
// };

// // ─── ImageLightbox ────────────────────────────────────────

// interface ImageLightboxProps {
//   src: string | null;
//   onClose: () => void;
// }

// const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, onClose }) => {
//   if (!src) return null;
//   return createPortal(
//     <div
//       className={styles['lightbox-overlay']}
//       onClick={onClose}
//       role="button"
//       aria-label="Закрыть изображение"
//       tabIndex={0}
//       onKeyDown={(e) => e.key === 'Escape' && onClose()}
//     >
//       <img
//         src={src}
//         alt=""
//         className={styles['lightbox-img']}
//         onClick={(e) => e.stopPropagation()}
//       />
//     </div>,
//     document.body
//   );
// };
