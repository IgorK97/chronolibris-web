// ============================================================
// Reader.tsx — компонент постраничного чтения книги
// Загружает JSON-файл (массив TextSegment[]), разбивает текст
// на страницы, кэширует их и отображает с навигацией.
// ============================================================

import React, {
  useState, // хук локального состояния компонента
  useEffect, // хук для побочных эффектов (загрузка данных, подписки)
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
  c: TextSegment[]; // содержимое сноски: массив вложенных сегментов (заголовок + параграфы)
}

// Note — встроенная сноска/пометка внутри TextSegment
export interface Note {
  t: string; // тип узла, всегда "note"
  role: string; // роль, например "footnote"
  xp: number[]; // числовой путь к узлу в дереве
  c: string; // видимая метка сноски, например "[4]"
  f?: Footnote; // необязательная полная структура сноски (title + body)
}

// TextSegment — один элемент исходного JSON-массива (параграф, заголовок и т.д.)
export interface TextSegment {
  t: string; // тип: "p" | "title" | "br" | "note" | "footnote"
  xp: number[]; // числовой путь к узлу в дереве документа
  c: string | TextSegment[] | (string | Note)[]; // содержимое: чистая строка, вложенные сегменты
  // или смешанный массив строк и Note-объектов
}

// PageSegment — один абзац/элемент уже на конкретной странице (после разбивки)
export interface PageSegment {
  originalIndex: number; // индекс соответствующего TextSegment в originalSegments[]
  text: string; // готовый извлечённый текст для отображения
  isContinuation: boolean; // true — абзац продолжает предыдущую страницу
  continuationId?: string; // уникальный ключ, например "seg-5" для повторных частей
  type: string; // повторяет TextSegment.t: "p" | "title" | "br"
  notes?: Note[]; // встроенные сноски, если они есть у этого сегмента
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

// ─── Пропсы компонента ──────────────────────────────────────
interface ReaderProps {
  filePath?: string; // путь к JSON-файлу книги (по умолчанию '/data/002.js')
  cacheSize?: number; // максимальное число страниц в кэше (по умолчанию 10)
  preloadAhead?: number; // сколько страниц вперёд предзагружать при навигации (по умолчанию 3)
}

// ─── Константы ──────────────────────────────────────────────
const DEFAULT_FONT_SIZE = 18; // начальный размер шрифта (px)
const MIN_FONT_SIZE = 12; // минимально допустимый размер
const MAX_FONT_SIZE = 32; // максимально допустимый размер
const DEFAULT_CACHE_SIZE = 10; // размер LRU-кэша по умолчанию
const DEFAULT_PRELOAD_AHEAD = 3; // количество страниц для предзагрузки

// ─── Компонент ──────────────────────────────────────────────
export const Reader: React.FC<ReaderProps> = ({
  filePath = '/data/002.js', // путь к файлу книги
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

  // pageCache — Map<pageNumber, CachedPage>: хранит уже сгенерированные страницы.
  const [pageCache, setPageCache] = useState<Map<number, CachedPage>>(
    new Map()
  );

  // pagePositions — Map<pageNumber, {segmentIndex, charOffset}>:
  // для каждой страницы запоминает, с какого сегмента и символа она начинается.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pagePositions, setPagePositions] = useState<
    Map<number, { segmentIndex: number; charOffset: number }>
  >(new Map());

  const containerRef = useRef<HTMLDivElement>(null); // ссылка на корневой <div> читалки
  const pageRef = useRef<HTMLDivElement>(null); // ссылка на активную страницу для замера размеров
  const isFlipping = useRef(false); // флаг анимации листания (ref, не state — нет ре-рендера)
  const estimatedCharsPerPage = useRef(800); // расчётное число символов на одну страницу
  const isCalculatingRef = useRef(false); // защита от повторного запуска расчёта страниц
  const pagePositionsRef = useRef<
    Map<number, { segmentIndex: number; charOffset: number }>
  >(new Map());

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
      setPageCache(new Map());
      setPagePositions(new Map());
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
  }, [state.fontSize, originalSegments.length]);
  // Зависимости те же, что и в эффекте 2 — пересчитываем при изменении шрифта или данных
  //Но здесь нет зависимости calculateTotalPages

  // ─── extractText: извлечение чистого текста из сегмента ─────
  // Рекурсивно обходит поле .c (строка | массив) и собирает строку.
  // Note-объекты пропускаются (возвращают ''), т.к. их текст — метка сноски, а не основной текст.
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
        .join(''); // объединяем без разделителей
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
            // Сноски добавляем только для целого (не разорванного) начала сегмента
            notes: currentCharOffset === 0 ? extractNotes(segment) : undefined,
          });
          charCount += remaining;
          currentIndex = i + 1; // следующий сегмент
          currentCharOffset = 0; // сброс смещения — следующий сегмент читаем с начала
        } else if (spaceLeft > 0) {
          // Текст не влезает целиком — берём только сколько есть места
          segmentsList.push({
            originalIndex: i,
            text: textToUse.substring(0, spaceLeft), // обрезаем до конца страницы
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

          charCount = maxChars; // страница заполнена — выходим из цикла
          currentIndex = i;
          currentCharOffset = currentCharOffset + spaceLeft;
          pagePositionsRef.current.set(pageNumber + 1, {
            segmentIndex: i,
            charOffset: currentCharOffset,
          });
        } else {
          break; // места нет и добавить нечего — выходим
        }
      }

      return { segments: segmentsList, pageNumber }; // возвращаем готовую страницу
    },
    [originalSegments, extractText, extractNotes]
  );

  // ─── getPage: получение страницы из кэша или генерация ──────
  // Сначала ищет страницу в pageCache. Если нашёл — возвращает сразу.
  // Иначе вызывает generatePage, сохраняет результат в кэш и возвращает.
  // При переполнении кэша вытесняет самую старую запись (LRU по timestamp).
  const getPage = useCallback(
    (pageNumber: number): PageContent => {
      if (pageNumber < 1) return { segments: [], pageNumber }; // защита от отрицательных номеров

      const cached = pageCache.get(pageNumber); // пробуем найти в кэше
      if (cached) {
        return cached.content; // кэш-хит: возвращаем готовое содержимое
      }
      // Кэш-промах: генерируем страницу
      const content = generatePage(pageNumber);

      // Обновляем кэш
      setPageCache((prev) => {
        const newCache = new Map(prev);
        // Если кэш переполнен — удаляем самую старую запись (по timestamp)
        if (newCache.size >= cacheSize) {
          const oldestKey = Array.from(newCache.keys()).sort(
            (a, b) =>
              (newCache.get(a)?.timestamp || 0) -
              (newCache.get(b)?.timestamp || 0)
          )[0]; // ключ с наименьшим timestamp = самая старая запись
          if (oldestKey !== undefined) newCache.delete(oldestKey);
        }
        // Сохраняем новую страницу с текущим временем
        newCache.set(pageNumber, {
          pageNumber,
          content,
          timestamp: Date.now(),
        });
        return newCache;
      });

      return content; // возвращаем сгенерированное содержимое
    },
    [pageCache, generatePage, cacheSize]
  );

  // ─── goToPage: переход на конкретную страницу ───────────────
  const goToPage = useCallback(
    (page: number) => {
      if (isFlipping.current) return; // если идёт анимация — игнорируем
      if (page < 1 || page > state.totalPages) return; // граничные проверки

      isFlipping.current = true; // ставим флаг анимации
      setState((prev) => ({ ...prev, currentPage: page })); // обновляем текущую страницу

      // Предзагрузка следующих preloadAhead страниц (кладём в кэш заранее)
      for (let i = 1; i <= preloadAhead; i++) {
        if (page + i <= state.totalPages) {
          getPage(page + i); // вызов создаёт запись в кэше как побочный эффект
        }
      }
      // Снимаем флаг анимации через 300 мс (длительность CSS-перехода)
      setTimeout(() => {
        isFlipping.current = false;
      }, 300);
    },
    [state.totalPages, preloadAhead, getPage]
  );

  // Переход на следующую страницу
  const nextPage = useCallback(() => {
    goToPage(state.currentPage + 1);
  }, [state.currentPage, goToPage]);

  // Переход на предыдущую страницу
  const prevPage = useCallback(() => {
    goToPage(state.currentPage - 1);
  }, [state.currentPage, goToPage]);

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
    setPageCache(new Map()); // инвалидируем кэш (шаг пагинации мог измениться)
    setPagePositions(new Map()); // инвалидируем позиции страниц
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

  // ─── Обработка клавиатуры ────────────────────────────────────
  // ArrowRight / PageDown → следующая страница
  // ArrowLeft / PageUp → предыдущая страница
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

  // ─── renderSegment: рендер одного PageSegment в JSX ─────────
  const renderSegment = useCallback(
    (seg: PageSegment, index: number, pageNum: number) => {
      if (seg.type === 'br') {
        // Пустая строка-разделитель
        return <br key={`${pageNum}-${index}`} />;
      }

      if (seg.type === 'title') {
        // Заголовок главы — <h2> с увеличенным на 30% шрифтом
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
      // Обычный параграф — <p>
      // Класс 'continuation' убирает отступ у продолжений разорванных абзацев
      return (
        <p
          key={`${pageNum}-${index}`}
          className={`${styles['paragraph']} ${seg.isContinuation ? styles['continuation'] : ''}`}
          style={{ fontSize: `${state.fontSize}px` }}
        >
          {seg.text}
          {/* Если у сегмента есть сноски — выводим метки надстрочными символами */}
          {seg.notes && seg.notes.length > 0 && (
            <span className={styles['footnote-marker']}>
              {seg.notes.map((note, i) => (
                <sup key={i}>{note.c}</sup> // note.c = "[4]", "[5]" и т.д.
              ))}
            </span>
          )}
        </p>
      );
    },
    [state.fontSize] // пересоздаём только при изменении fontSize
  );

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
