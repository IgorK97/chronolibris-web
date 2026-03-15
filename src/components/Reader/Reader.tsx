// ============================================================
// Reader.tsx — компонент чтения книги на CSS columns
// Весь текст фрагмента рендерится в один контейнер с
// column-count: 1 и фиксированной высотой. Браузер сам
// раскладывает контент по «страницам»-колонкам.
// Навигация — scrollTo на ширину viewport программно.
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
  s: number;
  e: number;
  xps: number[];
  xpe: number[];
  url: string;
}

export interface TocMeta {
  Title: string;
  Authors: { Role: string; First: string; Last: string }[];
  Annotation: string;
  Lang: string;
}

export interface TocData {
  Meta: TocMeta;
  full_length: number;
  Body: unknown[];
  Parts: TocPart[];
}

interface ReaderProps {
  tocPath?: string;
  filePath?: string;
  imagePath?: string;
}

const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;

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

export const Reader: React.FC<ReaderProps> = ({
  tocPath,
  filePath = '/data/002.js',
  imagePath,
}) => {
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [pageColor, setPageColor] = useState(PAGE_COLORS[0]);
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  // Текущая «страница» = индекс колонки (0-based)
  const [currentCol, setCurrentCol] = useState(0);
  // Общее число колонок — вычисляется после рендера по scrollWidth
  const [totalCols, setTotalCols] = useState(0);

  const [tocData, setTocData] = useState<TocData | null>(null);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  // viewport — внешний контейнер с overflow-x: hidden (скролл только программный)
  const viewportRef = useRef<HTMLDivElement>(null);
  // content — колоночный контейнер
  const contentRef = useRef<HTMLDivElement>(null);

  // ─── Загрузка toc ─────────────────────────────────────────

  useEffect(() => {
    if (!tocPath) return;
    fetch(tocPath)
      .then((r) => r.json())
      .then((data: TocData) => {
        setTocData(data);
        const idx = data.Parts.findIndex((p) => filePath.endsWith(p.url));
        if (idx !== -1) setCurrentPartIndex(idx);
      })
      .catch(console.error);
  }, [tocPath, filePath]);

  // ─── Загрузка фрагмента ────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setCurrentCol(0);
      fetch(filePath)
        .then((r) => r.json())
        .then((data: TextSegment[]) => {
          setSegments(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    };
    load();
  }, [filePath]);

  // ─── Подсчёт колонок ──────────────────────────────────────
  // scrollWidth всего book-content / clientWidth одного viewport = число колонок.
  // Вызывается после рендера и при ресайзе.

  const recalcCols = useCallback(() => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return;
    const cols = Math.round(ct.scrollWidth / vp.clientWidth);
    setTotalCols(Math.max(1, cols));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Задержка 50ms — браузер должен завершить layout колонок
      const id = setTimeout(recalcCols, 50);
      return () => clearTimeout(id);
    }
  }, [isLoading, fontSize, fontFamily, recalcCols]);

  useEffect(() => {
    window.addEventListener('resize', recalcCols);
    return () => window.removeEventListener('resize', recalcCols);
  }, [recalcCols]);

  // ─── Навигация по колонкам ────────────────────────────────

  const goToCol = useCallback(
    (col: number) => {
      const vp = viewportRef.current;
      if (!vp) return;
      const clamped = Math.max(0, Math.min(col, totalCols - 1));
      setCurrentCol(clamped);
      // Программный скролл: каждая «страница» = clientWidth viewport
      vp.scrollTo({
        left: clamped * (vp.clientWidth - 40),
        behavior: 'smooth',
      });
    },
    [totalCols]
  );

  const nextCol = useCallback(
    () => goToCol(currentCol + 1),
    [currentCol, goToCol]
  );
  const prevCol = useCallback(
    () => goToCol(currentCol - 1),
    [currentCol, goToCol]
  );

  // ─── Смена шрифта — сброс на первую колонку ───────────────

  const changeFontSize = useCallback((delta: number) => {
    setFontSize((prev) =>
      Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, prev + delta))
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
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') nextCol();
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevCol();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextCol, prevCol]);

  // ─── Прогресс чтения ─────────────────────────────────────

  const readPercent = useMemo<number>(() => {
    if (totalCols === 0) return 0;
    if (!tocData || tocData.Parts.length === 0) {
      return ((currentCol + 1) / totalCols) * 100;
    }
    const part = tocData.Parts[currentPartIndex];
    if (!part) return 0;
    const partLength = part.e - part.s + 1;
    const progressInPart = (currentCol + 1) / totalCols;
    const globalPos = part.s + partLength * progressInPart;
    return Math.min(100, (globalPos / tocData.full_length) * 100);
  }, [tocData, currentPartIndex, currentCol, totalCols]);

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
  // Рендерит один TextSegment напрямую, без пагинации.
  // Браузер сам раскладывает контент по колонкам.

  const renderSegment = (seg: TextSegment, index: number): React.ReactNode => {
    if (seg.t === 'br') return <br key={index} />;

    // Изображение
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

    // Вычисляем inline-содержимое
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

    if (seg.t === 'title') {
      return (
        <h2
          key={index}
          className={styles['title']}
          style={{ fontSize: `${fontSize}px`, fontFamily, color: textColor }}
        >
          {getContent()}
        </h2>
      );
    }

    return (
      <p
        key={index}
        className={styles['paragraph']}
        style={{ fontSize: `${fontSize}px`, fontFamily, color: textColor }}
      >
        {getContent()}
      </p>
    );
  };
  // [imagePath, renderInlineContent]
  if (isLoading) {
    return (
      <div className={styles['loading']}>
        <div className={styles['spinner']} />
        <p>Загрузка книги...</p>
      </div>
    );
  }

  return (
    <div className={styles['reader']} style={{ background: bgColor }}>
      {/* Тулбар */}
      <div className={styles['toolbar']}>
        <div className={styles['controls']}>
          <button
            onClick={prevCol}
            disabled={currentCol <= 0}
            className={styles['nav-button']}
          >
            ← Назад
          </button>

          <span className={styles['page-info']}>
            {`Стр. ${currentCol + 1} / ${totalCols}`}
            {tocData && (
              <span className={styles['read-percent']}>
                {' '}
                ({readPercent.toFixed(1)}%)
              </span>
            )}
          </span>

          <button
            onClick={nextCol}
            disabled={currentCol >= totalCols - 1}
            className={styles['nav-button']}
          >
            Вперёд →
          </button>
        </div>

        <div className={styles['settings']}>
          <button
            onClick={() => setColorModalOpen(true)}
            className={styles['color-button']}
            aria-label="Настройка цветов"
            title="Цвета"
          >
            🎨
          </button>
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
        {/*
          book-viewport — контейнер с overflow-x: hidden.
          Пользователь не может скроллить руками — только кнопки/клавиши.
        */}
        <div
          className={styles['book-viewport']}
          ref={viewportRef}
          style={{ background: pageColor }}
        >
          {/*
            book-content — колоночный контейнер.
            CSS: columns: 1; column-fill: auto; height: 100%
            Ширина колонки = 100% viewport, т.е. одна колонка = одна страница.
            column-gap создаёт отступ между «страницами» в горизонтальном потоке.
          */}
          <div className={styles['book-content']} ref={contentRef}>
            {segments.map((seg, idx) => renderSegment(seg, idx))}
          </div>
        </div>

        {/* Зоны клика поверх текста */}
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

      {/* Прогресс-бар */}
      <div className={styles['progress-bar']}>
        <div
          className={styles['progress-fill']}
          style={{ width: `${readPercent}%` }}
        />
      </div>

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

  const rows: {
    label: string;
    colors: string[];
    value: string;
    onChange: (c: string) => void;
  }[] = [
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
