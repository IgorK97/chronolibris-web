// ============================================================
// Reader.tsx — компонент постраничного чтения книги
// Загружает JSON-файл (массив TextSegment[]), разбивает текст
// на страницы, кэширует их и отображает с навигацией.
// ============================================================
// import * as Dialog from '@radix-ui/react-dialog';
import { createPortal } from 'react-dom';
import React, {
  useState, // хук локального состояния компонента
  useEffect, // хук для побочных эффектов
  useCallback, // мемоизация функций, чтобы не пересоздавать при каждом рендере
  useRef, // мутируемая ссылка, НЕ вызывающая ре-рендер при изменении
  useMemo, // мемоизация вычисляемых значений
} from 'react';
// import { ReaderState, TextSegment, PageContent, PageSegment, CachedPage, Note } from './types';
import styles from './Reader.module.css'; // CSS-модуль: стили с локальными именами классов

// Footnote — сноска, вложенная внутри Note
export interface Footnote {
  t: string; // тип узла, всегда "footnote"
  xp: number[]; // путь к узлу в исходном XML/дереве
  c: string | string[]; // содержимое сноски: строка или массив строк
}

// Note — встроенная сноска/пометка внутри TextSegment
export interface Note {
  t: string; // тип узла, всегда "note"
  role: string; // роль, например "footnote"
  xp: number[]; // числовой путь к узлу в дереве
  c: string; // видимая метка сноски, например "[4]"
  f?: Footnote; // необязательная полная структура сноски (title + body)
}

// InlineNode — вложенный узел с форматированием (em, st) или сноска
export type InlineNode = Note | { t: 'em' | 'st'; c: string };

// ImgNode — дочерний узел изображения внутри сегмента t:"img"
export interface ImgNode {
  t: 'img';
  src: string; // имя файла, например "1.jpg"
}

// TextSegment — один элемент исходного JSON-массива (параграф, заголовок и т.д.)
export interface TextSegment {
  t: string; // тип: "p" | "title" | "br" | "note" | "footnote" | "em" | "st"
  xp?: number[]; // числовой путь к узлу в дереве документа
  c: string | TextSegment[] | (string | InlineNode)[] | ImgNode[]; // содержимое: чистая строка, вложенные сегменты
  // или смешанный массив строк и InlineNode-объектов
}

// PageSegment — один абзац/элемент уже на конкретной странице (после разбивки)
export interface PageSegment {
  originalIndex: number; // индекс соответствующего TextSegment в originalSegments[]
  text: string; // готовый извлечённый текст для отображения
  isContinuation: boolean; // true — абзац продолжает предыдущую страницу
  continuationId?: string; // уникальный ключ, например "seg-5" для повторных частей
  type: string; // повторяет TextSegment.t: "p" | "title" | "br"
  notes?: Note[]; // встроенные сноски, если они есть у этого сегмента
  // Rich-content: массив инлайн-узлов для рендера с форматированием и сносками
  // Заполняется только для целых (не разорванных) сегментов
  inlineContent?: (string | InlineNode)[];
  imgSrc?: string;
}

// PageContent — всё содержимое одной страницы
export interface PageContent {
  segments: PageSegment[]; // список сегментов на этой странице
  pageNumber: number; // номер страницы (начиная с 1)
}

// ReaderState — объединённое состояние компонента-читалки
export interface ReaderState {
  currentPage: number; // текущая отображаемая страница
  totalPages: number; // всего страниц (вычисляется после загрузки)
  fontSize: number; // текущий размер шрифта в пикселях
  viewMode: 'single' | 'double'; // режим: одна страница или разворот
  isLoading: boolean; // true пока файл ещё не загружен
}

// CachedPage — запись в кэше страниц
export interface CachedPage {
  pageNumber: number; // ключ кэша
  content: PageContent; // сохранённое содержимое
  timestamp: number; // время кэширования (Date.now()), используется для вытеснения LRU
}

// ─── Интерфейсы оглавления (toc.js) ─────────────────────────

// Одна запись Parts[]: описывает один фрагмент-файл книги
export interface TocPart {
  s: number; // глобальный индекс первого абзаца фрагмента
  e: number; // глобальный индекс последнего абзаца фрагмента
  xps: number[]; // xp первого сегмента фрагмента
  xpe: number[]; // xp последнего сегмента фрагмента
  url: string; // относительный URL файла фрагмента, например "002.js"
}

export interface TocMeta {
  Title: string; // название книги
  Authors: { Role: string; First: string; Last: string }[];
  Annotation: string; // аннотация
  Lang: string; // язык
}

// Полная структура toc.js
export interface TocData {
  Meta: TocMeta;
  full_length: number; // общее число абзацев во всей книге
  Body: unknown[]; // структура глав (не используется здесь напрямую)
  Parts: TocPart[]; // массив фрагментов-файлов
}

// ─── Пропсы компонента ──────────────────────────────────────
interface ReaderProps {
  // Путь к toc.js. Если не передан — работаем без глобального прогресса.
  tocPath?: string;
  filePath?: string; // путь к JSON-файлу книги (по умолчанию '/data/002.js')
  imagePath?: string;
  cacheSize?: number; // максимальное число страниц в кэше (по умолчанию 10)
  preloadAhead?: number; // сколько страниц вперёд предзагружать при навигации (по умолчанию 3)
}

// ─── Константы ──────────────────────────────────────────────
const DEFAULT_FONT_SIZE = 18; // начальный размер шрифта (px)
const MIN_FONT_SIZE = 12; // минимально допустимый размер
const MAX_FONT_SIZE = 32; // максимально допустимый размер
const DEFAULT_CACHE_SIZE = 10; // размер LRU-кэша по умолчанию
const DEFAULT_PRELOAD_AHEAD = 3; // количество страниц для предзагрузки

// ─── Вспомогательная функция: найти ближайшую границу слова ──
// Ищет последний пробел в строке str[0..maxLen-1].
// Если пробел найден — возвращает его позицию + 1 (разрыв после пробела).
// Если нет — возвращает maxLen (разрыв на точном лимите символов).
// Это гарантирует, что страница никогда не обрывается посередине слова.
function findWordBoundary(str: string, maxLen: number): number {
  if (maxLen >= str.length) return str.length;
  // Ищем последний пробел в пределах лимита
  const lastSpace = str.lastIndexOf(' ', maxLen);
  if (lastSpace > 0) return lastSpace + 1; // +1: пробел остаётся на текущей странице
  return maxLen; // слово длиннее страницы — разрываем принудительно
}

// ─── Компонент ──────────────────────────────────────────────
export const Reader: React.FC<ReaderProps> = ({
  tocPath, // путь к toc.js (опционально)
  filePath = '/data/002.js', // путь к файлу книги (fallback)
  imagePath, // базовый URL папки с картинками книги
  cacheSize = DEFAULT_CACHE_SIZE, // максимум записей в кэше
  preloadAhead = DEFAULT_PRELOAD_AHEAD, // сколько страниц вперёд грузить заранее
}) => {
  // originalSegments — «чистый» исходный массив сегментов из файла.
  // ВАЖНО: он никогда не должен мутироваться; generatePage читает его только на чтение.
  const [originalSegments, setOriginalSegments] = useState<TextSegment[]>([]);
  // state — основное состояние читалки: номер страницы, шрифт, режим, флаг загрузки
  const [state, setState] = useState<ReaderState>({
    currentPage: 1,
    totalPages: 0,
    fontSize: DEFAULT_FONT_SIZE,
    viewMode: 'single',
    isLoading: true,
  });

  const pageCacheRef = useRef<Map<number, CachedPage>>(new Map());

  // ── Данные для глобального прогресса чтения ──────────────────
  // tocData хранит весь toc.js; null если tocPath не задан или не загружен.
  const [tocData, setTocData] = useState<TocData | null>(null);

  // Индекс текущего фрагмента в массиве Parts[] (какой NNN.js открыт)
  const [currentPartIndex, setCurrentPartIndex] = useState<number>(0);

  const [activeImage, setActiveImage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null); // ссылка на корневой <div> читалки
  const pageRef = useRef<HTMLDivElement>(null); // ссылка на активную страницу для замера размеров
  const isFlipping = useRef(false); // флаг анимации листания (ref, не state — нет ре-рендера)
  const estimatedCharsPerPage = useRef(800); // расчётное число символов на одну страницу
  const isCalculatingRef = useRef(false); // защита от повторного запуска расчёта страниц
  const pagePositionsRef = useRef<
    Map<number, { segmentIndex: number; charOffset: number }>
  >(new Map());

  // ─── Состояние модального окна сноски ───────────────────────
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // ─── Эффект: загрузка toc.js ─────────────────────────────────
  // Загружается один раз; даёт нам full_length и Parts[] для прогресса.
  // Архитектурно: в будущем здесь же можно решать, какой фрагмент загрузить
  // исходя из сохранённой позиции пользователя.
  useEffect(() => {
    if (!tocPath) return; // если tocPath не передан — работаем без toc

    const loadToc = async () => {
      try {
        const response = await fetch(tocPath);
        if (!response.ok) throw new Error(`Failed to load toc: ${tocPath}`);
        const data: TocData = await response.json();
        setTocData(data);

        // Определяем, какой фрагмент соответствует filePath
        const partIdx = data.Parts.findIndex((p) => filePath.endsWith(p.url));
        if (partIdx !== -1) setCurrentPartIndex(partIdx);
      } catch (err) {
        console.error('Error loading toc:', err);
      }
    };

    loadToc();
  }, [tocPath, filePath]);

  // ─── Эффект 1: загрузка файла ───────────────────────────────
  // Запускается один раз при монтировании (и при изменении filePath).
  useEffect(() => {
    const loadFile = async () => {
      try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        const data = await response.json();
        setOriginalSegments(data);
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Error loading file:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadFile();
  }, [filePath]); // зависимость: только filePath — повторный запуск при смене файла

  // ─── Эффект 2: сброс кэша при смене шрифта ──────────────────
  // При изменении fontSize старый кэш и позиции страниц становятся невалидными
  // (размер страницы изменился), поэтому всё сбрасывается до начала.
  useEffect(() => {
    if (originalSegments.length > 0) {
      //   setPageCache(new Map());
      pageCacheRef.current = new Map();
      pagePositionsRef.current = new Map(); // сбрасываем синхронно через ref
      //   setPagePositions(new Map());
      setState((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [state.fontSize, originalSegments.length]);
  // Зависимости: fontSize (изменился шрифт) и originalSegments.length (загружены новые данные)

  // ─── Эффект 3: замер контейнера и пересчёт числа страниц ────
  // Когда pageRef.current доступен и данные загружены, рассчитываем
  // сколько символов помещается на экране, затем вычисляем totalPages.
  useEffect(() => {
    if (
      pageRef.current && // DOM-элемент страницы уже отрисован
      originalSegments.length > 0 && // данные загружены
      !isCalculatingRef.current // не идёт параллельный расчёт
    ) {
      isCalculatingRef.current = true; // ставим блокировку
      const container = pageRef.current;
      // Приблизительная ширина одного символа = 60% от fontSize
      const charWidth = state.fontSize * 0.6;
      // Высота одной строки = 150% от fontSize (line-height: 1.5)
      const lineHeight = state.fontSize * 1.5;
      // Количество символов в одной строке = ширина контейнера / ширина символа
      const charsPerLine = Math.floor(container.clientWidth / charWidth);
      // Количество строк на странице = высота контейнера / высота строки
      const linesPerPage = Math.floor(container.clientHeight / lineHeight);
      // Итоговое число символов на страницу с коэффициентом 0.85 (поправка на отступы/пробелы)
      estimatedCharsPerPage.current = charsPerLine * linesPerPage * 0.85;

      calculateTotalPages(); // обновляем state.totalPages
      isCalculatingRef.current = false; // снимаем блокировку
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.fontSize, originalSegments.length]);
  // Зависимости те же, что и в эффекте 2 — пересчитываем при изменении шрифта или данных
  // calculateTotalPages намеренно не в deps: вызывается только отсюда,
  // добавление вызвало бы бесконечный цикл через setState → re-render.

  // ─── extractText: извлечение чистого текста из сегмента ─────
  // Рекурсивно обходит поле .c (строка | массив) и собирает строку.
  // Note-объекты пропускаются (возвращают ''), т.к. их текст — метка сноски, а не основной текст.
  // em/st — включаются как обычный текст (для подсчёта символов при пагинации).
  const IMG_PLACEHOLDER_LEN = 100; // условная «стоимость» картинки в символах
  const extractText = useCallback((segment: TextSegment): string => {
    if (typeof segment.c === 'string') {
      return segment.c;
    } else if (Array.isArray(segment.c)) {
      return segment.c
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item.t === 'note') return (item as Note).c; // метка "[N]" входит в счёт символов
          if (item.t === 'em' || item.t === 'st')
            return (item as { t: string; c: string }).c;
          return extractText(item as TextSegment);
        })
        .join('');
    }
    return ''; // fallback для неизвестных форматов
  }, []); // нет зависимостей — чистая функция

  // ─── extractNotes: извлечение сносок из сегмента ────────────
  // Проходит по массиву .c и собирает все Note-объекты (t === 'note').
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

  // ─── extractInlineContent: «богатое» содержимое сегмента ─────
  // Возвращает массив (string | InlineNode) для рендера с форматированием.
  // Для простых строк — оборачивает в массив с одним элементом.
  const extractInlineContent = useCallback(
    (segment: TextSegment): (string | InlineNode)[] => {
      if (typeof segment.c === 'string') return [segment.c];
      if (Array.isArray(segment.c)) {
        return segment.c.map((item) => {
          if (typeof item === 'string') return item;
          return item as InlineNode;
        });
      }
      return [];
    },
    []
  );

  // ─── calculateTotalPages: расчёт общего числа страниц ───────
  // Суммирует длину всех текстов и делит на размер одной страницы.
  const calculateTotalPages = useCallback(() => {
    if (originalSegments.length === 0 || estimatedCharsPerPage.current <= 0)
      return;

    let totalChars = 0;
    // Суммируем длину текста каждого сегмента
    originalSegments.forEach((seg) => {
      totalChars += extractText(seg).length;
    });

    // ceil — округляем вверх; || 1 — минимум 1 страница
    const total = Math.ceil(totalChars / estimatedCharsPerPage.current) || 1;
    setState((prev) => ({ ...prev, totalPages: total }));
  }, [originalSegments, extractText]);

  // Генерация страницы
  const generatePage = useCallback(
    (pageNumber: number): PageContent => {
      if (originalSegments.length === 0) return { segments: [], pageNumber };

      const segmentsList: PageSegment[] = []; // накапливаем сегменты текущей страницы
      let charCount = 0; // сколько символов уже собрали на эту страницу
      const startPos = pagePositionsRef.current.get(pageNumber);
      console.log('StartPos', pageNumber, startPos);
      let currentIndex = startPos?.segmentIndex ?? 0;
      let currentCharOffset = startPos?.charOffset ?? 0;
      const maxChars = estimatedCharsPerPage.current;

      // Основной цикл: проходим по originalSegments пока не заполним страницу
      for (
        let i = currentIndex;
        i < originalSegments.length && charCount < maxChars;
        i++
      ) {
        const segment = originalSegments[i]; // текущий исходный сегмент
        const fullText = extractText(segment); // полный текст сегмента
        // Если сегмент уже частично попал на предыдущую страницу — берём остаток
        const textToUse =
          currentCharOffset > 0
            ? fullText.substring(currentCharOffset)
            : fullText;
        const remaining = textToUse.length; // сколько символов осталось в сегменте
        const spaceLeft = maxChars - charCount; // сколько символов ещё вмещает страница

        if (remaining <= spaceLeft) {
          // Весь текст сегмента помещается на страницу — добавляем целиком
          segmentsList.push({
            originalIndex: i,
            text: textToUse,
            isContinuation: currentCharOffset > 0,
            continuationId: currentCharOffset > 0 ? `seg-${i}` : undefined,
            type: segment.t,
            // Сноски и rich-content добавляем только для целого (не разорванного) начала сегмента
            notes: currentCharOffset === 0 ? extractNotes(segment) : undefined,
            inlineContent: extractInlineContent(segment),
            // currentCharOffset === 0
            //   ? extractInlineContent(segment)
            //   : undefined,
          });
          charCount += remaining;
          currentIndex = i + 1; // следующий сегмент
          currentCharOffset = 0; // сброс смещения — следующий сегмент читаем с начала
          if (charCount >= maxChars) {
            pagePositionsRef.current.set(pageNumber + 1, {
              segmentIndex: i + 1,
              charOffset: 0,
            });
            console.log(pageNumber + 1, {
              segmentIndex: i + 1,
              charOffset: 0,
            });
          }
        } else {
          const breakAt = findWordBoundary(textToUse, spaceLeft);
          pagePositionsRef.current.set(pageNumber + 1, {
            segmentIndex: i,
            charOffset: currentCharOffset + breakAt,
          });
          console.log(pageNumber + 1, {
            segmentIndex: i,
            charOffset: currentCharOffset + breakAt,
          });
          segmentsList.push({
            originalIndex: i,
            text: textToUse.substring(0, breakAt),
            // isContinuation: currentCharOffset > 0 || charCount > 0,
            isContinuation: currentCharOffset > 0,
            continuationId: currentCharOffset > 0 ? `seg-${i}` : undefined,
            type: segment.t,
            inlineContent: extractInlineContent(segment),
            // currentCharOffset === 0
            //   ? extractInlineContent(segment)
            //   : undefined,
          });

          charCount = maxChars;
        }
        // else {
        //   break;
        // }
      }

      return { segments: segmentsList, pageNumber }; // возвращаем готовую страницу
    },
    [originalSegments, extractText, extractNotes, extractInlineContent]
    // pagePositionsRef не нужен в deps — это ref, не state
  );

  // ─── getPage: получение страницы из кэша или генерация ──────
  // Сначала ищет страницу в pageCache. Если нашёл — возвращает сразу.
  // Иначе вызывает generatePage, сохраняет результат в кэш и возвращает.
  // При переполнении кэша вытесняет самую старую запись (LRU по timestamp).
  const getPage = useCallback(
    (pageNumber: number): PageContent => {
      if (pageNumber < 1) return { segments: [], pageNumber }; // защита от отрицательных номеров

      //   const cached = pageCache.get(pageNumber); // пробуем найти в кэше
      const cached = pageCacheRef.current.get(pageNumber);
      if (cached) {
        return cached.content; // кэш-хит: возвращаем готовое содержимое
      }
      // Кэш-промах: генерируем страницу
      const content = generatePage(pageNumber);

      if (pageCacheRef.current.size >= cacheSize) {
        const oldestKey = Array.from(pageCacheRef.current.keys()).sort(
          (a, b) =>
            (pageCacheRef.current.get(a)?.timestamp || 0) -
            (pageCacheRef.current.get(b)?.timestamp || 0)
        )[0];
        if (oldestKey !== undefined) pageCacheRef.current.delete(oldestKey);
      }

      pageCacheRef.current.set(pageNumber, {
        pageNumber,
        content,
        timestamp: Date.now(),
      });

      return content;
    },
    [generatePage, cacheSize]
  );

  // ─── goToPage: переход на конкретную страницу ───────────────
  const goToPage = useCallback(
    (newPage: number) => {
      if (isFlipping.current) return; // если идёт анимация — игнорируем
      if (newPage < 1 || newPage > state.totalPages) return; // граничные проверки

      isFlipping.current = true; // ставим флаг анимации

      // ВАЖНО: сначала генерируем саму целевую страницу (если её нет в кэше).
      // generatePage(N) как побочный эффект записывает в pagePositionsRef
      // позицию начала страницы N+1. Без этого шага предзагрузка N+1
      // вызовет generatePage(N+1) с пустым startPos — и получит страницу 1.
      getPage(newPage);

      // Предзагружаем следующие страницы СТРОГО ПОСЛЕДОВАТЕЛЬНО:
      // getPage(N+1) должен идти только после getPage(N), иначе
      // pagePositionsRef для N+1 ещё не заполнен.
      for (let i = 1; i <= preloadAhead; i++) {
        if (newPage + i <= state.totalPages) {
          getPage(newPage + i);
        }
      }

      setState((prev) => ({ ...prev, currentPage: newPage }));

      // Снимаем флаг анимации через 300 мс (длительность CSS-перехода)
      setTimeout(() => {
        isFlipping.current = false;
      }, 300);
    },
    [state.totalPages, preloadAhead, getPage]
  );

  const nextPage = useCallback(() => {
    if (state.viewMode === 'double') {
      // Определяем левую страницу текущего разворота
      const leftPage =
        state.currentPage % 2 === 0 ? state.currentPage : state.currentPage - 1;
      goToPage(leftPage + 2);
    } else {
      goToPage(state.currentPage + 1);
    }
  }, [state.currentPage, state.viewMode, goToPage]);

  // Переход на предыдущую страницу
  const prevPage = useCallback(() => {
    if (state.viewMode === 'double') {
      const leftPage =
        state.currentPage % 2 === 0 ? state.currentPage : state.currentPage - 1;
      goToPage(leftPage - 2);
    } else {
      goToPage(state.currentPage - 1);
    }
  }, [state.currentPage, state.viewMode, goToPage]);

  // Изменение размера шрифта на delta пикселей (положительное или отрицательное)
  const changeFontSize = useCallback((delta: number) => {
    setState((prev) => {
      const newSize = Math.min(
        MAX_FONT_SIZE,
        Math.max(MIN_FONT_SIZE, prev.fontSize + delta) // зажимаем в диапазон [MIN, MAX]
      );
      return { ...prev, fontSize: newSize };
    });
  }, []);

  // Переключение режима single ↔ double (одна страница / разворот)
  const toggleViewMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewMode: prev.viewMode === 'single' ? 'double' : 'single',
      currentPage: 1, // сбрасываем на первую страницу при смене режима
    }));
    pageCacheRef.current = new Map();
    // setPageCache(new Map()); // инвалидируем кэш (шаг пагинации мог измениться)
    pagePositionsRef.current = new Map();
  }, []);

  // ─── displayedPages: список страниц для рендера ─────────────
  // В режиме 'single' — одна страница (currentPage).
  // В режиме 'double' — разворот: чётная (левая) + нечётная (правая).
  const displayedPages = useMemo(() => {
    const pages: PageContent[] = [];

    if (state.viewMode === 'double') {
      // Левая страница разворота — всегда чётная
      const leftPage =
        state.currentPage % 2 === 0 ? state.currentPage : state.currentPage - 1;
      const rightPage = leftPage + 1; // правая страница = левая + 1

      if (leftPage >= 1) pages.push(getPage(leftPage));
      if (rightPage <= state.totalPages) pages.push(getPage(rightPage));
    } else {
      // Одиночный режим — просто текущая страница
      pages.push(getPage(state.currentPage));
    }

    return pages;
  }, [state.currentPage, state.viewMode, state.totalPages, getPage]);

  // ─── FIX 3: readPercent — процент прочитанного по всей книге ─
  //
  // Алгоритм (без загрузки всех фрагментов):
  //   toc.js содержит Parts[i].s и Parts[i].e — глобальные индексы абзацев
  //   каждого фрагмента, и full_length — общее число абзацев в книге.
  //
  //   Мы знаем:
  //     - currentPartIndex: какой фрагмент открыт
  //     - currentPage, totalPages: прогресс внутри фрагмента
  //
  //   Вычисление:
  //     globalStart = Parts[currentPartIndex].s  ← первый абзац фрагмента
  //     globalEnd   = Parts[currentPartIndex].e  ← последний абзац фрагмента
  //     partLength  = globalEnd - globalStart + 1 ← абзацев во фрагменте
  //     progressInPart = currentPage / totalPages  ← прогресс внутри (0..1)
  //     globalPos = globalStart + partLength * progressInPart
  //     readPercent = (globalPos / full_length) * 100
  //
  //   Это линейная аппроксимация: считаем, что абзацы равномерно
  //   распределены по страницам. Точности достаточно для прогресс-бара.
  //   Реальный счётчик был бы точнее при накоплении pagePositions всего файла,
  //   но требовал бы полной генерации всех страниц заранее.
  const readPercent = useMemo<number>(() => {
    // Если toc не загружен — используем прогресс внутри фрагмента
    if (!tocData || tocData.Parts.length === 0) {
      if (state.totalPages === 0) return 0;
      return (state.currentPage / state.totalPages) * 100;
    }

    const part = tocData.Parts[currentPartIndex];
    if (!part) return 0;

    const partLength = part.e - part.s + 1; // абзацев во фрагменте
    const progressInPart =
      state.totalPages > 0 ? state.currentPage / state.totalPages : 0;

    // Глобальная позиция (в абзацах) от начала книги
    const globalPos = part.s + partLength * progressInPart;

    return Math.min(100, (globalPos / tocData.full_length) * 100);
  }, [tocData, currentPartIndex, state.currentPage, state.totalPages]);

  // ─── Обработка клавиатуры ────────────────────────────────────
  // ArrowRight / PageDown → следующая страница
  // ArrowLeft / PageUp → предыдущая страница
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveNote(null);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage]);

  // ─── renderInlineContent: рендер богатого содержимого параграфа ──
  // Обходит массив (string | InlineNode) и преобразует в JSX-узлы:
  //   строка → текстовый узел
  //   em     → <em>
  //   st     → <strong>
  //   note   → кликабельный [N] с обработчиком открытия сноски
  const renderInlineContent = useCallback(
    (content: (string | InlineNode)[], segKey: string): React.ReactNode => {
      return content.map((item, idx) => {
        if (typeof item === 'string') {
          return <React.Fragment key={idx}>{item}</React.Fragment>;
        }
        if (item.t === 'em') {
          return <em key={idx}>{(item as { t: string; c: string }).c}</em>;
        }
        if (item.t === 'st') {
          return (
            <strong key={idx}>{(item as { t: string; c: string }).c}</strong>
          );
        }
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
    [setActiveNote]
  );

  // ─── renderSegment: рендер одного PageSegment в JSX ─────────
  const renderSegment = useCallback(
    (seg: PageSegment, index: number, pageNum: number) => {
      if (seg.type === 'br') {
        return <br key={`${pageNum}-${index}`} />;
      }

      // Определяем содержимое: rich если есть inlineContent, иначе plain text
      const content = seg.inlineContent
        ? renderInlineContent(seg.inlineContent, `${pageNum}-${index}`)
        : seg.text;

      if (seg.type === 'title') {
        return (
          <h2
            key={`${pageNum}-${index}`}
            className={styles['title']}
            style={{ fontSize: `${state.fontSize * 1.3}px` }}
          >
            {content}
          </h2>
        );
      }
      // Обычный параграф
      return (
        <p
          key={`${pageNum}-${index}`}
          className={`${styles['paragraph']} ${seg.isContinuation ? styles['continuation'] : ''}`}
          style={{ fontSize: `${state.fontSize}px` }}
        >
          {content}
        </p>
      );
    },
    [state.fontSize, renderInlineContent]
  );

  // ─── FootnoteModal: модальное окно с текстом сноски ──────────
  const FootnoteModal = useCallback(() => {
    if (!activeNote) return null;

    const footnoteText = activeNote.f
      ? Array.isArray(activeNote.f.c)
        ? activeNote.f.c.join('\n\n')
        : activeNote.f.c
      : '';

    return (
      <div
        className={styles['footnote-overlay']}
        onClick={() => setActiveNote(null)}
      >
        <div
          className={styles['footnote-modal']}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <button
            className={styles['footnote-close']}
            onClick={() => setActiveNote(null)}
            aria-label="Закрыть"
          >
            ✕
          </button>
          <div className={styles['footnote-content']}>
            <span className={styles['footnote-label']}>{activeNote.c}</span>
            <p>{footnoteText}</p>
          </div>
        </div>
      </div>
    );
  }, [activeNote]);
  // position: fixed работает относительно viewport только если
  // ни один из предков не имеет transform, filter, perspective
  // или will-change: transform. У reader-контейнера, скорее всего,
  // есть один из этих CSS-свойств (например, для анимации листания),
  // что «пробивает» контекст позиционирования и fixed прикрепляется к нему,
  // а не к окну. Решение — createPortal(…, document.body): модалка монтируется
  // напрямую в <body>, полностью вне дерева reader, и position: fixed работает как ожидается.

  // const FootnoteModal = useCallback(() => {
  //   if (!activeNote) return null;

  //   const footnoteText = activeNote.f
  //     ? Array.isArray(activeNote.f.c)
  //       ? activeNote.f.c.join('\n\n')
  //       : activeNote.f.c
  //     : '';

  //   return createPortal(
  //     <div
  //       className={styles['footnote-overlay']}
  //       onClick={() => setActiveNote(null)}
  //     >
  //       <div
  //         className={styles['footnote-modal']}
  //         onClick={(e) => e.stopPropagation()}
  //         role="dialog"
  //         aria-modal="true"
  //       >
  //         <button
  //           className={styles['footnote-close']}
  //           onClick={() => setActiveNote(null)}
  //           aria-label="Закрыть"
  //         >
  //           ✕
  //         </button>
  //         <div className={styles['footnote-content']}>
  //           <span className={styles['footnote-label']}>{activeNote.c}</span>
  //           <p>{footnoteText}</p>
  //         </div>
  //       </div>
  //     </div>,
  //     document.body
  //   );
  // }, [activeNote]);

  if (state.isLoading) {
    return (
      <div className={styles['loading']}>
        <div className={styles['spinner']}></div>
        <p>Загрузка книги...</p>
      </div>
    );
  }

  // ─── Основной рендер ─────────────────────────────────────────
  return (
    <div className={styles['reader']} ref={containerRef}>
      {/* Панель управления */}
      <div className={styles['toolbar']}>
        <div className={styles['controls']}>
          <button
            onClick={prevPage}
            disabled={
              state.viewMode === 'double'
                ? // leftPage <= 2 означает некуда идти назад
                  (state.currentPage % 2 === 0
                    ? state.currentPage
                    : state.currentPage - 1) <= 2
                : state.currentPage <= 1
            }
            className={styles['nav-button']}
          >
            ← Назад
          </button>

          {/* <span className={styles['page-info']}>
            Страница {state.currentPage} из {state.totalPages}
          </span> */}

          <span className={styles['page-info']}>
            {state.viewMode === 'double'
              ? // В двойном режиме показываем диапазон страниц разворота
                (() => {
                  const left =
                    state.currentPage % 2 === 0
                      ? state.currentPage
                      : state.currentPage - 1;
                  const right = Math.min(left + 1, state.totalPages);
                  return `${left}–${right} / ${state.totalPages}`;
                })()
              : `Стр. ${state.currentPage} / ${state.totalPages}`}
            {/* Процент по всей книге — только если есть toc */}
            {tocData && (
              <span className={styles['read-percent']}>
                {' '}
                ({readPercent.toFixed(1)}%)
              </span>
            )}
          </span>

          <button
            onClick={nextPage}
            disabled={
              state.viewMode === 'double'
                ? (state.currentPage % 2 === 0
                    ? state.currentPage
                    : state.currentPage - 1) +
                    2 >
                  state.totalPages
                : state.currentPage >= state.totalPages
            }
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
            className={styles['font-button']}
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
            className={`${styles.page} ${
              pageIndex === displayedPages.length - 1
                ? styles['active-page']
                : ''
            } ${isFlipping.current ? styles['flipping'] : ''}`}
            // pageRef вешается на последнюю (или единственную) страницу разворота
            // для замера размеров в эффекте 3
            ref={pageIndex === displayedPages.length - 1 ? pageRef : null}
          >
            {/* Рендерим все сегменты страницы */}
            {page.segments.map((seg, idx) =>
              renderSegment(seg, idx, page.pageNumber)
            )}
            <div className={styles['page-number']}>{page.pageNumber}</div>
          </div>
        ))}
      </div>

      {/* Навигация кликом - почему-то не отображается */}
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
      {/* <div className={styles['progress-bar']}>
        <div
          className={styles['progress-fill']}
          style={{ width: `${(state.currentPage / state.totalPages) * 100}%` }}
        />
      </div> */}
      <div className={styles['progress-bar']}>
        <div
          className={styles['progress-fill']}
          style={{ width: `${readPercent}%` }}
        />
      </div>

      {/* Модальное окно сноски */}
      <FootnoteModal />
    </div>
  );
};

export default Reader;

// // ============================================================
// // Reader.tsx — компонент постраничного чтения книги
// // Загружает JSON-файл (массив TextSegment[]), разбивает текст
// // на страницы, кэширует их и отображает с навигацией.
// // ============================================================

// import React, {
//   useState, // хук локального состояния компонента
//   useEffect, // хук для побочных эффектов
//   useCallback, // мемоизация функций, чтобы не пересоздавать при каждом рендере
//   useRef, // мутируемая ссылка, НЕ вызывающая ре-рендер при изменении
//   useMemo, // мемоизация вычисляемых значений
// } from 'react';
// // import { ReaderState, TextSegment, PageContent, PageSegment, CachedPage, Note } from './types';
// import styles from './Reader.module.css'; // CSS-модуль: стили с локальными именами классов

// // Footnote — сноска, вложенная внутри Note
// export interface Footnote {
//   t: string; // тип узла, всегда "footnote"
//   xp: number[]; // путь к узлу в исходном XML/дереве
//   c: TextSegment[]; // содержимое сноски: массив вложенных сегментов (заголовок + параграфы)
// }

// // Note — встроенная сноска/пометка внутри TextSegment
// export interface Note {
//   t: string; // тип узла, всегда "note"
//   role: string; // роль, например "footnote"
//   xp: number[]; // числовой путь к узлу в дереве
//   c: string; // видимая метка сноски, например "[4]"
//   f?: Footnote; // необязательная полная структура сноски (title + body)
// }

// // TextSegment — один элемент исходного JSON-массива (параграф, заголовок и т.д.)
// export interface TextSegment {
//   t: string; // тип: "p" | "title" | "br" | "note" | "footnote"
//   xp: number[]; // числовой путь к узлу в дереве документа
//   c: string | TextSegment[] | (string | Note)[]; // содержимое: чистая строка, вложенные сегменты
//   // или смешанный массив строк и Note-объектов
// }

// // PageSegment — один абзац/элемент уже на конкретной странице (после разбивки)
// export interface PageSegment {
//   originalIndex: number; // индекс соответствующего TextSegment в originalSegments[]
//   text: string; // готовый извлечённый текст для отображения
//   isContinuation: boolean; // true — абзац продолжает предыдущую страницу
//   continuationId?: string; // уникальный ключ, например "seg-5" для повторных частей
//   type: string; // повторяет TextSegment.t: "p" | "title" | "br"
//   notes?: Note[]; // встроенные сноски, если они есть у этого сегмента
// }

// // PageContent — всё содержимое одной страницы
// export interface PageContent {
//   segments: PageSegment[]; // список сегментов на этой странице
//   pageNumber: number; // номер страницы (начиная с 1)
// }

// // ReaderState — объединённое состояние компонента-читалки
// export interface ReaderState {
//   currentPage: number; // текущая отображаемая страница
//   totalPages: number; // всего страниц (вычисляется после загрузки)
//   fontSize: number; // текущий размер шрифта в пикселях
//   viewMode: 'single' | 'double'; // режим: одна страница или разворот
//   isLoading: boolean; // true пока файл ещё не загружен
// }

// // CachedPage — запись в кэше страниц
// export interface CachedPage {
//   pageNumber: number; // ключ кэша
//   content: PageContent; // сохранённое содержимое
//   timestamp: number; // время кэширования (Date.now()), используется для вытеснения LRU
// }

// // ─── Интерфейсы оглавления (toc.js) ─────────────────────────

// // Одна запись Parts[]: описывает один фрагмент-файл книги
// export interface TocPart {
//   s: number; // глобальный индекс первого абзаца фрагмента
//   e: number; // глобальный индекс последнего абзаца фрагмента
//   xps: number[]; // xp первого сегмента фрагмента
//   xpe: number[]; // xp последнего сегмента фрагмента
//   url: string; // относительный URL файла фрагмента, например "002.js"
// }

// export interface TocMeta {
//   Title: string; // название книги
//   Authors: { Role: string; First: string; Last: string }[];
//   Annotation: string; // аннотация
//   Lang: string; // язык
// }

// // Полная структура toc.js
// export interface TocData {
//   Meta: TocMeta;
//   full_length: number; // общее число абзацев во всей книге
//   Body: unknown[]; // структура глав (не используется здесь напрямую)
//   Parts: TocPart[]; // массив фрагментов-файлов
// }

// // ─── Пропсы компонента ──────────────────────────────────────
// interface ReaderProps {
//   // Путь к toc.js. Если не передан — работаем без глобального прогресса.
//   tocPath?: string;
//   filePath?: string; // путь к JSON-файлу книги (по умолчанию '/data/002.js')
//   cacheSize?: number; // максимальное число страниц в кэше (по умолчанию 10)
//   preloadAhead?: number; // сколько страниц вперёд предзагружать при навигации (по умолчанию 3)
// }

// // ─── Константы ──────────────────────────────────────────────
// const DEFAULT_FONT_SIZE = 18; // начальный размер шрифта (px)
// const MIN_FONT_SIZE = 12; // минимально допустимый размер
// const MAX_FONT_SIZE = 32; // максимально допустимый размер
// const DEFAULT_CACHE_SIZE = 10; // размер LRU-кэша по умолчанию
// const DEFAULT_PRELOAD_AHEAD = 3; // количество страниц для предзагрузки

// // ─── Вспомогательная функция: найти ближайшую границу слова ──
// // Ищет последний пробел в строке str[0..maxLen-1].
// // Если пробел найден — возвращает его позицию + 1 (разрыв после пробела).
// // Если нет — возвращает maxLen (разрыв на точном лимите символов).
// // Это гарантирует, что страница никогда не обрывается посередине слова.
// function findWordBoundary(str: string, maxLen: number): number {
//   if (maxLen >= str.length) return str.length;
//   // Ищем последний пробел в пределах лимита
//   const lastSpace = str.lastIndexOf(' ', maxLen);
//   if (lastSpace > 0) return lastSpace + 1; // +1: пробел остаётся на текущей странице
//   return maxLen; // слово длиннее страницы — разрываем принудительно
// }

// // ─── Компонент ──────────────────────────────────────────────
// export const Reader: React.FC<ReaderProps> = ({
//   tocPath, // путь к toc.js (опционально)
//   filePath = '/data/002.js', // путь к файлу книги (fallback)
//   cacheSize = DEFAULT_CACHE_SIZE, // максимум записей в кэше
//   preloadAhead = DEFAULT_PRELOAD_AHEAD, // сколько страниц вперёд грузить заранее
// }) => {
//   // originalSegments — «чистый» исходный массив сегментов из файла.
//   // ВАЖНО: он никогда не должен мутироваться; generatePage читает его только на чтение.
//   const [originalSegments, setOriginalSegments] = useState<TextSegment[]>([]);
//   // state — основное состояние читалки: номер страницы, шрифт, режим, флаг загрузки
//   const [state, setState] = useState<ReaderState>({
//     currentPage: 1,
//     totalPages: 0,
//     fontSize: DEFAULT_FONT_SIZE,
//     viewMode: 'single',
//     isLoading: true,
//   });

//   const pageCacheRef = useRef<Map<number, CachedPage>>(new Map());

//   // ── Данные для глобального прогресса чтения ──────────────────
//   // tocData хранит весь toc.js; null если tocPath не задан или не загружен.
//   const [tocData, setTocData] = useState<TocData | null>(null);

//   // Индекс текущего фрагмента в массиве Parts[] (какой NNN.js открыт)
//   const [currentPartIndex, setCurrentPartIndex] = useState<number>(0);

//   const containerRef = useRef<HTMLDivElement>(null); // ссылка на корневой <div> читалки
//   const pageRef = useRef<HTMLDivElement>(null); // ссылка на активную страницу для замера размеров
//   const isFlipping = useRef(false); // флаг анимации листания (ref, не state — нет ре-рендера)
//   const estimatedCharsPerPage = useRef(800); // расчётное число символов на одну страницу
//   const isCalculatingRef = useRef(false); // защита от повторного запуска расчёта страниц
//   const pagePositionsRef = useRef<
//     Map<number, { segmentIndex: number; charOffset: number }>
//   >(new Map());

//   // ─── Эффект: загрузка toc.js ─────────────────────────────────
//   // Загружается один раз; даёт нам full_length и Parts[] для прогресса.
//   // Архитектурно: в будущем здесь же можно решать, какой фрагмент загрузить
//   // исходя из сохранённой позиции пользователя.
//   useEffect(() => {
//     if (!tocPath) return; // если tocPath не передан — работаем без toc

//     const loadToc = async () => {
//       try {
//         const response = await fetch(tocPath);
//         if (!response.ok) throw new Error(`Failed to load toc: ${tocPath}`);
//         const data: TocData = await response.json();
//         setTocData(data);

//         // Определяем, какой фрагмент соответствует filePath
//         const partIdx = data.Parts.findIndex((p) => filePath.endsWith(p.url));
//         if (partIdx !== -1) setCurrentPartIndex(partIdx);
//       } catch (err) {
//         console.error('Error loading toc:', err);
//       }
//     };

//     loadToc();
//   }, [tocPath, filePath]);

//   // ─── Эффект 1: загрузка файла ───────────────────────────────
//   // Запускается один раз при монтировании (и при изменении filePath).
//   useEffect(() => {
//     const loadFile = async () => {
//       try {
//         const response = await fetch(filePath);
//         if (!response.ok) throw new Error(`Failed to load ${filePath}`);
//         const data = await response.json();
//         setOriginalSegments(data);
//         setState((prev) => ({ ...prev, isLoading: false }));
//       } catch (error) {
//         console.error('Error loading file:', error);
//         setState((prev) => ({ ...prev, isLoading: false }));
//       }
//     };

//     loadFile();
//   }, [filePath]); // зависимость: только filePath — повторный запуск при смене файла

//   // ─── Эффект 2: сброс кэша при смене шрифта ──────────────────
//   // При изменении fontSize старый кэш и позиции страниц становятся невалидными
//   // (размер страницы изменился), поэтому всё сбрасывается до начала.
//   useEffect(() => {
//     if (originalSegments.length > 0) {
//       //   setPageCache(new Map());
//       pageCacheRef.current = new Map();
//       pagePositionsRef.current = new Map(); // сбрасываем синхронно через ref
//       //   setPagePositions(new Map());
//       setState((prev) => ({ ...prev, currentPage: 1 }));
//     }
//   }, [state.fontSize, originalSegments.length]);
//   // Зависимости: fontSize (изменился шрифт) и originalSegments.length (загружены новые данные)

//   // ─── Эффект 3: замер контейнера и пересчёт числа страниц ────
//   // Когда pageRef.current доступен и данные загружены, рассчитываем
//   // сколько символов помещается на экране, затем вычисляем totalPages.
//   useEffect(() => {
//     if (
//       pageRef.current && // DOM-элемент страницы уже отрисован
//       originalSegments.length > 0 && // данные загружены
//       !isCalculatingRef.current // не идёт параллельный расчёт
//     ) {
//       isCalculatingRef.current = true; // ставим блокировку
//       const container = pageRef.current;
//       // Приблизительная ширина одного символа = 60% от fontSize
//       const charWidth = state.fontSize * 0.6;
//       // Высота одной строки = 150% от fontSize (line-height: 1.5)
//       const lineHeight = state.fontSize * 1.5;
//       // Количество символов в одной строке = ширина контейнера / ширина символа
//       const charsPerLine = Math.floor(container.clientWidth / charWidth);
//       // Количество строк на странице = высота контейнера / высота строки
//       const linesPerPage = Math.floor(container.clientHeight / lineHeight);
//       // Итоговое число символов на страницу с коэффициентом 0.85 (поправка на отступы/пробелы)
//       estimatedCharsPerPage.current = charsPerLine * linesPerPage * 0.85;

//       calculateTotalPages(); // обновляем state.totalPages
//       isCalculatingRef.current = false; // снимаем блокировку
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [state.fontSize, originalSegments.length]);
//   // Зависимости те же, что и в эффекте 2 — пересчитываем при изменении шрифта или данных
//   // calculateTotalPages намеренно не в deps: вызывается только отсюда,
//   // добавление вызвало бы бесконечный цикл через setState → re-render.

//   // ─── extractText: извлечение чистого текста из сегмента ─────
//   // Рекурсивно обходит поле .c (строка | массив) и собирает строку.
//   // Note-объекты пропускаются (возвращают ''), т.к. их текст — метка сноски, а не основной текст.
//   const extractText = useCallback((segment: TextSegment): string => {
//     if (typeof segment.c === 'string') {
//       return segment.c;
//     } else if (Array.isArray(segment.c)) {
//       return segment.c
//         .map((item) => {
//           if (typeof item === 'string') return item;
//           if (item.t === 'note') return '';
//           return extractText(item as TextSegment);
//         })
//         .join(''); // объединяем без разделителей
//     }
//     return ''; // fallback для неизвестных форматов
//   }, []); // нет зависимостей — чистая функция

//   // ─── extractNotes: извлечение сносок из сегмента ────────────
//   // Проходит по массиву .c и собирает все Note-объекты (t === 'note').
//   const extractNotes = useCallback((segment: TextSegment): Note[] => {
//     const notes: Note[] = [];
//     if (Array.isArray(segment.c)) {
//       segment.c.forEach((item) => {
//         if (typeof item !== 'string' && item.t === 'note') {
//           notes.push(item as Note);
//         }
//       });
//     }
//     return notes;
//   }, []);

//   // ─── calculateTotalPages: расчёт общего числа страниц ───────
//   // Суммирует длину всех текстов и делит на размер одной страницы.
//   const calculateTotalPages = useCallback(() => {
//     if (originalSegments.length === 0 || estimatedCharsPerPage.current <= 0)
//       return;

//     let totalChars = 0;
//     // Суммируем длину текста каждого сегмента
//     originalSegments.forEach((seg) => {
//       totalChars += extractText(seg).length;
//     });

//     // ceil — округляем вверх; || 1 — минимум 1 страница
//     const total = Math.ceil(totalChars / estimatedCharsPerPage.current) || 1;
//     setState((prev) => ({ ...prev, totalPages: total }));
//   }, [originalSegments, extractText]);

//   // Генерация страницы
//   const generatePage = useCallback(
//     (pageNumber: number): PageContent => {
//       if (originalSegments.length === 0) return { segments: [], pageNumber };

//       const segmentsList: PageSegment[] = []; // накапливаем сегменты текущей страницы
//       let charCount = 0; // сколько символов уже собрали на эту страницу
//       const startPos = pagePositionsRef.current.get(pageNumber);
//       console.log('StartPos', pageNumber, startPos);
//       let currentIndex = startPos?.segmentIndex ?? 0;
//       let currentCharOffset = startPos?.charOffset ?? 0;
//       const maxChars = estimatedCharsPerPage.current;

//       // Основной цикл: проходим по originalSegments пока не заполним страницу
//       for (
//         let i = currentIndex;
//         i < originalSegments.length && charCount < maxChars;
//         i++
//       ) {
//         const segment = originalSegments[i]; // текущий исходный сегмент
//         const fullText = extractText(segment); // полный текст сегмента
//         // Если сегмент уже частично попал на предыдущую страницу — берём остаток
//         const textToUse =
//           currentCharOffset > 0
//             ? fullText.substring(currentCharOffset)
//             : fullText;
//         const remaining = textToUse.length; // сколько символов осталось в сегменте
//         const spaceLeft = maxChars - charCount; // сколько символов ещё вмещает страница

//         if (remaining <= spaceLeft) {
//           // Весь текст сегмента помещается на страницу — добавляем целиком
//           segmentsList.push({
//             originalIndex: i,
//             text: textToUse,
//             isContinuation: currentCharOffset > 0,
//             continuationId: currentCharOffset > 0 ? `seg-${i}` : undefined,
//             type: segment.t,
//             // Сноски добавляем только для целого (не разорванного) начала сегмента
//             notes: currentCharOffset === 0 ? extractNotes(segment) : undefined,
//           });
//           charCount += remaining;
//           currentIndex = i + 1; // следующий сегмент
//           currentCharOffset = 0; // сброс смещения — следующий сегмент читаем с начала
//           if (charCount >= maxChars) {
//             pagePositionsRef.current.set(pageNumber + 1, {
//               segmentIndex: i + 1,
//               charOffset: 0,
//             });
//             console.log(pageNumber + 1, {
//               segmentIndex: i + 1,
//               charOffset: 0,
//             });
//           }
//         } else {
//           const breakAt = findWordBoundary(textToUse, spaceLeft);
//           pagePositionsRef.current.set(pageNumber + 1, {
//             segmentIndex: i,
//             charOffset: currentCharOffset + breakAt,
//           });
//           console.log(pageNumber + 1, {
//             segmentIndex: i,
//             charOffset: currentCharOffset + breakAt,
//           });
//           segmentsList.push({
//             originalIndex: i,
//             text: textToUse.substring(0, breakAt),
//             // isContinuation: currentCharOffset > 0 || charCount > 0,
//             isContinuation: currentCharOffset > 0,
//             continuationId: currentCharOffset > 0 ? `seg-${i}` : undefined,
//             type: segment.t,
//           });

//           charCount = maxChars;
//         }
//         // else {
//         //   break;
//         // }
//       }

//       return { segments: segmentsList, pageNumber }; // возвращаем готовую страницу
//     },
//     [originalSegments, extractText, extractNotes]
//     // pagePositionsRef не нужен в deps — это ref, не state
//   );

//   // ─── getPage: получение страницы из кэша или генерация ──────
//   // Сначала ищет страницу в pageCache. Если нашёл — возвращает сразу.
//   // Иначе вызывает generatePage, сохраняет результат в кэш и возвращает.
//   // При переполнении кэша вытесняет самую старую запись (LRU по timestamp).
//   const getPage = useCallback(
//     (pageNumber: number): PageContent => {
//       if (pageNumber < 1) return { segments: [], pageNumber }; // защита от отрицательных номеров

//       //   const cached = pageCache.get(pageNumber); // пробуем найти в кэше
//       const cached = pageCacheRef.current.get(pageNumber);
//       if (cached) {
//         return cached.content; // кэш-хит: возвращаем готовое содержимое
//       }
//       // Кэш-промах: генерируем страницу
//       const content = generatePage(pageNumber);

//       if (pageCacheRef.current.size >= cacheSize) {
//         const oldestKey = Array.from(pageCacheRef.current.keys()).sort(
//           (a, b) =>
//             (pageCacheRef.current.get(a)?.timestamp || 0) -
//             (pageCacheRef.current.get(b)?.timestamp || 0)
//         )[0];
//         if (oldestKey !== undefined) pageCacheRef.current.delete(oldestKey);
//       }

//       pageCacheRef.current.set(pageNumber, {
//         pageNumber,
//         content,
//         timestamp: Date.now(),
//       });

//       return content;
//     },
//     [generatePage, cacheSize]
//   );

//   // ─── goToPage: переход на конкретную страницу ───────────────
//   const goToPage = useCallback(
//     (newPage: number) => {
//       if (isFlipping.current) return; // если идёт анимация — игнорируем
//       if (newPage < 1 || newPage > state.totalPages) return; // граничные проверки

//       isFlipping.current = true; // ставим флаг анимации

//       // ВАЖНО: сначала генерируем саму целевую страницу (если её нет в кэше).
//       // generatePage(N) как побочный эффект записывает в pagePositionsRef
//       // позицию начала страницы N+1. Без этого шага предзагрузка N+1
//       // вызовет generatePage(N+1) с пустым startPos — и получит страницу 1.
//       getPage(newPage);

//       // Предзагружаем следующие страницы СТРОГО ПОСЛЕДОВАТЕЛЬНО:
//       // getPage(N+1) должен идти только после getPage(N), иначе
//       // pagePositionsRef для N+1 ещё не заполнен.
//       for (let i = 1; i <= preloadAhead; i++) {
//         if (newPage + i <= state.totalPages) {
//           getPage(newPage + i);
//         }
//       }

//       setState((prev) => ({ ...prev, currentPage: newPage }));

//       // Снимаем флаг анимации через 300 мс (длительность CSS-перехода)
//       setTimeout(() => {
//         isFlipping.current = false;
//       }, 300);
//     },
//     [state.totalPages, preloadAhead, getPage]
//   );

//   const nextPage = useCallback(() => {
//     if (state.viewMode === 'double') {
//       // Определяем левую страницу текущего разворота
//       const leftPage =
//         state.currentPage % 2 === 0 ? state.currentPage : state.currentPage - 1;
//       goToPage(leftPage + 2);
//     } else {
//       goToPage(state.currentPage + 1);
//     }
//   }, [state.currentPage, state.viewMode, goToPage]);

//   // Переход на предыдущую страницу
//   const prevPage = useCallback(() => {
//     if (state.viewMode === 'double') {
//       const leftPage =
//         state.currentPage % 2 === 0 ? state.currentPage : state.currentPage - 1;
//       goToPage(leftPage - 2);
//     } else {
//       goToPage(state.currentPage - 1);
//     }
//   }, [state.currentPage, state.viewMode, goToPage]);

//   // Изменение размера шрифта на delta пикселей (положительное или отрицательное)
//   const changeFontSize = useCallback((delta: number) => {
//     setState((prev) => {
//       const newSize = Math.min(
//         MAX_FONT_SIZE,
//         Math.max(MIN_FONT_SIZE, prev.fontSize + delta) // зажимаем в диапазон [MIN, MAX]
//       );
//       return { ...prev, fontSize: newSize };
//     });
//   }, []);

//   // Переключение режима single ↔ double (одна страница / разворот)
//   const toggleViewMode = useCallback(() => {
//     setState((prev) => ({
//       ...prev,
//       viewMode: prev.viewMode === 'single' ? 'double' : 'single',
//       currentPage: 1, // сбрасываем на первую страницу при смене режима
//     }));
//     pageCacheRef.current = new Map();
//     // setPageCache(new Map()); // инвалидируем кэш (шаг пагинации мог измениться)
//     pagePositionsRef.current = new Map();
//   }, []);

//   // ─── displayedPages: список страниц для рендера ─────────────
//   // В режиме 'single' — одна страница (currentPage).
//   // В режиме 'double' — разворот: чётная (левая) + нечётная (правая).
//   const displayedPages = useMemo(() => {
//     const pages: PageContent[] = [];

//     if (state.viewMode === 'double') {
//       // Левая страница разворота — всегда чётная
//       const leftPage =
//         state.currentPage % 2 === 0 ? state.currentPage : state.currentPage - 1;
//       const rightPage = leftPage + 1; // правая страница = левая + 1

//       if (leftPage >= 1) pages.push(getPage(leftPage));
//       if (rightPage <= state.totalPages) pages.push(getPage(rightPage));
//     } else {
//       // Одиночный режим — просто текущая страница
//       pages.push(getPage(state.currentPage));
//     }

//     return pages;
//   }, [state.currentPage, state.viewMode, state.totalPages, getPage]);

//   // ─── FIX 3: readPercent — процент прочитанного по всей книге ─
//   //
//   // Алгоритм (без загрузки всех фрагментов):
//   //   toc.js содержит Parts[i].s и Parts[i].e — глобальные индексы абзацев
//   //   каждого фрагмента, и full_length — общее число абзацев в книге.
//   //
//   //   Мы знаем:
//   //     - currentPartIndex: какой фрагмент открыт
//   //     - currentPage, totalPages: прогресс внутри фрагмента
//   //
//   //   Вычисление:
//   //     globalStart = Parts[currentPartIndex].s  ← первый абзац фрагмента
//   //     globalEnd   = Parts[currentPartIndex].e  ← последний абзац фрагмента
//   //     partLength  = globalEnd - globalStart + 1 ← абзацев во фрагменте
//   //     progressInPart = currentPage / totalPages  ← прогресс внутри (0..1)
//   //     globalPos = globalStart + partLength * progressInPart
//   //     readPercent = (globalPos / full_length) * 100
//   //
//   //   Это линейная аппроксимация: считаем, что абзацы равномерно
//   //   распределены по страницам. Точности достаточно для прогресс-бара.
//   //   Реальный счётчик был бы точнее при накоплении pagePositions всего файла,
//   //   но требовал бы полной генерации всех страниц заранее.
//   const readPercent = useMemo<number>(() => {
//     // Если toc не загружен — используем прогресс внутри фрагмента
//     if (!tocData || tocData.Parts.length === 0) {
//       if (state.totalPages === 0) return 0;
//       return (state.currentPage / state.totalPages) * 100;
//     }

//     const part = tocData.Parts[currentPartIndex];
//     if (!part) return 0;

//     const partLength = part.e - part.s + 1; // абзацев во фрагменте
//     const progressInPart =
//       state.totalPages > 0 ? state.currentPage / state.totalPages : 0;

//     // Глобальная позиция (в абзацах) от начала книги
//     const globalPos = part.s + partLength * progressInPart;

//     return Math.min(100, (globalPos / tocData.full_length) * 100);
//   }, [tocData, currentPartIndex, state.currentPage, state.totalPages]);

//   // ─── Обработка клавиатуры ────────────────────────────────────
//   // ArrowRight / PageDown → следующая страница
//   // ArrowLeft / PageUp → предыдущая страница
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === 'ArrowRight' || e.key === 'PageDown') {
//         nextPage();
//       } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
//         prevPage();
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [nextPage, prevPage]);

//   // ─── renderSegment: рендер одного PageSegment в JSX ─────────
//   const renderSegment = useCallback(
//     (seg: PageSegment, index: number, pageNum: number) => {
//       if (seg.type === 'br') {
//         // Пустая строка-разделитель
//         return <br key={`${pageNum}-${index}`} />;
//       }

//       if (seg.type === 'title') {
//         // Заголовок главы — <h2> с увеличенным на 30% шрифтом
//         return (
//           <h2
//             key={`${pageNum}-${index}`}
//             className={styles['title']}
//             style={{ fontSize: `${state.fontSize * 1.3}px` }}
//           >
//             {seg.text}
//           </h2>
//         );
//       }
//       // Обычный параграф — <p>
//       // Класс 'continuation' убирает отступ у продолжений разорванных абзацев
//       return (
//         <p
//           key={`${pageNum}-${index}`}
//           className={`${styles['paragraph']} ${seg.isContinuation ? styles['continuation'] : ''}`}
//           style={{ fontSize: `${state.fontSize}px` }}
//         >
//           {seg.text}
//           {/* Если у сегмента есть сноски — выводим метки надстрочными символами */}
//           {seg.notes && seg.notes.length > 0 && (
//             <span className={styles['footnote-marker']}>
//               {seg.notes.map((note, i) => (
//                 <sup key={i}>{note.c}</sup> // note.c = "[4]", "[5]" и т.д.
//               ))}
//             </span>
//           )}
//         </p>
//       );
//     },
//     [state.fontSize] // пересоздаём только при изменении fontSize
//   );

//   if (state.isLoading) {
//     return (
//       <div className={styles['loading']}>
//         <div className={styles['spinner']}></div>
//         <p>Загрузка книги...</p>
//       </div>
//     );
//   }

//   // ─── Основной рендер ─────────────────────────────────────────
//   return (
//     <div className={styles['reader']} ref={containerRef}>
//       {/* Панель управления */}
//       <div className={styles['toolbar']}>
//         <div className={styles['controls']}>
//           <button
//             onClick={prevPage}
//             disabled={
//               state.viewMode === 'double'
//                 ? // leftPage <= 2 означает некуда идти назад
//                   (state.currentPage % 2 === 0
//                     ? state.currentPage
//                     : state.currentPage - 1) <= 2
//                 : state.currentPage <= 1
//             }
//             className={styles['nav-button']}
//           >
//             ← Назад
//           </button>

//           {/* <span className={styles['page-info']}>
//             Страница {state.currentPage} из {state.totalPages}
//           </span> */}

//           <span className={styles['page-info']}>
//             {state.viewMode === 'double'
//               ? // В двойном режиме показываем диапазон страниц разворота
//                 (() => {
//                   const left =
//                     state.currentPage % 2 === 0
//                       ? state.currentPage
//                       : state.currentPage - 1;
//                   const right = Math.min(left + 1, state.totalPages);
//                   return `${left}–${right} / ${state.totalPages}`;
//                 })()
//               : `Стр. ${state.currentPage} / ${state.totalPages}`}
//             {/* Процент по всей книге — только если есть toc */}
//             {tocData && (
//               <span className={styles['read-percent']}>
//                 {' '}
//                 ({readPercent.toFixed(1)}%)
//               </span>
//             )}
//           </span>

//           <button
//             onClick={nextPage}
//             disabled={
//               state.viewMode === 'double'
//                 ? (state.currentPage % 2 === 0
//                     ? state.currentPage
//                     : state.currentPage - 1) +
//                     2 >
//                   state.totalPages
//                 : state.currentPage >= state.totalPages
//             }
//             className={styles['nav-button']}
//           >
//             Вперёд →
//           </button>
//         </div>

//         <div className={styles['settings']}>
//           <button
//             onClick={() => changeFontSize(-2)}
//             className={styles['font-button']}
//           >
//             A-
//           </button>
//           <span className={styles['font-size']}>{state.fontSize}px</span>
//           <button
//             onClick={() => changeFontSize(2)}
//             className={styles['font-button']}
//           >
//             A+
//           </button>

//           <button onClick={toggleViewMode} className={styles['mode-button']}>
//             {state.viewMode === 'single' ? '2 страницы' : '1 страница'}
//           </button>
//         </div>
//       </div>

//       {/* Область чтения */}
//       <div className={styles['reading-area']}>
//         {displayedPages.map((page, pageIndex) => (
//           <div
//             key={page.pageNumber}
//             className={`${styles.page} ${
//               pageIndex === displayedPages.length - 1
//                 ? styles['active-page']
//                 : ''
//             } ${isFlipping.current ? styles['flipping'] : ''}`}
//             // pageRef вешается на последнюю (или единственную) страницу разворота
//             // для замера размеров в эффекте 3
//             ref={pageIndex === displayedPages.length - 1 ? pageRef : null}
//           >
//             {/* Рендерим все сегменты страницы */}
//             {page.segments.map((seg, idx) =>
//               renderSegment(seg, idx, page.pageNumber)
//             )}
//             <div className={styles['page-number']}>{page.pageNumber}</div>
//           </div>
//         ))}
//       </div>

//       {/* Навигация кликом - почему-то не отображается */}
//       <div className={styles['click-zones']}>
//         <div
//           className={styles['prev-zone']}
//           onClick={prevPage}
//           role="button"
//           tabIndex={0}
//           aria-label="Предыдущая страница"
//         />
//         <div
//           className={styles['next-zone']}
//           onClick={nextPage}
//           role="button"
//           tabIndex={0}
//           aria-label="Следующая страница"
//         />
//       </div>

//       {/* Прогресс бар */}
//       {/* <div className={styles['progress-bar']}>
//         <div
//           className={styles['progress-fill']}
//           style={{ width: `${(state.currentPage / state.totalPages) * 100}%` }}
//         />
//       </div> */}
//       <div className={styles['progress-bar']}>
//         <div
//           className={styles['progress-fill']}
//           style={{ width: `${readPercent}%` }}
//         />
//       </div>
//     </div>
//   );
// };

// export default Reader;
