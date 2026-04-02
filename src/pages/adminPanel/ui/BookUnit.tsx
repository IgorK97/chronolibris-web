/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/BookUnit.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  // useBookById,
  useBookContents,
  useUnlinkContentFromBook,
  useLinkContentToBook,
  useCreateBook,
  useUpdateBook,
  fileToBase64,
  useBookDetails,
} from '@/api/books';
import { useLanguages, useCountries } from '@/api/references';
import {
  usePersonRoles,
  usePersonSuggestions,
  type PersonSuggestionDto,
  type PersonRoleDto,
} from '@api/searchReference';
import type { PersonRoleFilterRequest } from '@/api/search';
import { useDebounce } from '@/hooks/useDebounce';
import type {
  ContentDto,
  CreateBookRequest,
  UpdateBookRequest,
} from '@/types/types';
import { ContentSearchPopup } from './ContentSearchPopup';
import { BookFileManagement } from './BookFileManagement';
import styles from './BookUnit.module.css';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '@/stores/globalStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SelectedPerson {
  id: number;
  name: string;
  roleId: number | null;
}

interface AutocompleteItem {
  id: number;
  name: string;
}

// ---------------------------------------------------------------------------
// PersonFilter – переиспользован из AdvancedSearchPanel, расширен для формы
// ---------------------------------------------------------------------------

function PersonFilter({
  value,
  roles,
  onChange,
}: {
  value: PersonRoleFilterRequest[];
  roles: PersonRoleDto[];
  onChange: (v: PersonRoleFilterRequest[]) => void;
}) {
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<SelectedPerson[]>(() =>
    value.flatMap((pf) =>
      pf.personIds.map((id) => ({ id, name: `#${id}`, roleId: pf.roleId }))
    )
  );
  const [showDropDown, setShowDropDown] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  const { data: suggestions = [] } = usePersonSuggestions(debouncedInput);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node))
        setShowDropDown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const emitChange = (next: SelectedPerson[]) => {
    setSelected(next);
    const grouped = new Map<number, number[]>();
    for (const p of next) {
      if (p.roleId == null) continue;
      if (!grouped.has(p.roleId)) grouped.set(p.roleId, []);
      grouped.get(p.roleId)!.push(p.id);
    }
    onChange(
      Array.from(grouped.entries()).map(([roleId, personIds]) => ({
        roleId,
        personIds,
      }))
    );
  };

  const handleSelect = (person: PersonSuggestionDto) => {
    if (selected.some((p) => p.id === person.id)) {
      setInput('');
      setShowDropDown(false);
      return;
    }
    emitChange([
      ...selected,
      { id: person.id, name: person.name, roleId: null },
    ]);
    setInput('');
    setShowDropDown(false);
  };

  const handleRoleChange = (personId: number, roleId: number) => {
    emitChange(selected.map((p) => (p.id === personId ? { ...p, roleId } : p)));
  };

  const handleRemove = (personId: number) => {
    emitChange(selected.filter((p) => p.id !== personId));
  };

  return (
    <div className={styles['field-group']}>
      <label className={styles['field-label']}>Персоналии</label>

      {selected.length > 0 && (
        <div className={styles['person-list']}>
          {selected.map((p) => (
            <div key={p.id} className={styles['person-row']}>
              <span className={styles['person-name']}>{p.name}</span>
              <select
                className={styles['role-select']}
                value={p.roleId ?? ''}
                onChange={(e) => handleRoleChange(p.id, Number(e.target.value))}
              >
                <option value="" disabled>
                  Выберите роль
                </option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles['remove-btn']}
                onClick={() => handleRemove(p.id)}
                aria-label="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles['autocomplete-wrapper']} ref={wrapperRef}>
        <input
          className={styles['field-input']}
          placeholder="Введите имя персоны..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropDown(true);
          }}
          onFocus={() => input.length >= 2 && setShowDropDown(true)}
        />
        {showDropDown && suggestions.length > 0 && (
          <ul className={styles['autocomplete-dropdown']}>
            {suggestions.map((s) => (
              <li
                key={s.id}
                className={styles['autocomplete-item']}
                onMouseDown={() => handleSelect(s)}
              >
                {s.imagePath && (
                  <img
                    src={s.imagePath}
                    alt=""
                    className={styles['person-avatar']}
                  />
                )}
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic autocomplete field (language, country, publisher)
// ---------------------------------------------------------------------------

function AutocompleteField({
  label,
  selectedId,
  selectedName,
  items,
  placeholder,
  onSelect,
  onClear,
}: {
  label: string;
  selectedId: number | null;
  selectedName: string;
  items: AutocompleteItem[];
  placeholder?: string;
  onSelect: (item: AutocompleteItem) => void;
  onClear: () => void;
}) {
  const [input, setInput] = useState(selectedName);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // sync when external selectedName changes (e.g. after book load)
  useEffect(() => {
    setInput(selectedName);
  }, [selectedName]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className={styles['field-group']}>
      <label className={styles['field-label']}>{label}</label>
      <div className={styles['autocomplete-wrapper']} ref={wrapperRef}>
        <div className={styles['autocomplete-input-row']}>
          <input
            className={styles['field-input']}
            placeholder={placeholder ?? 'Начните вводить...'}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (selectedId !== null) onClear();
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
          {selectedId !== null && (
            <button
              type="button"
              className={styles['clear-btn']}
              onClick={() => {
                onClear();
                setInput('');
              }}
            >
              ✕
            </button>
          )}
        </div>
        {open && input.length > 0 && filtered.length > 0 && (
          <ul className={styles['autocomplete-dropdown']}>
            {filtered.slice(0, 20).map((item) => (
              <li
                key={item.id}
                className={`${styles['autocomplete-item']} ${
                  item.id === selectedId
                    ? styles['autocomplete-item--selected']
                    : ''
                }`}
                onMouseDown={() => {
                  onSelect(item);
                  setInput(item.name);
                  setOpen(false);
                }}
              >
                {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CoverUpload
// ---------------------------------------------------------------------------

function CoverUpload({
  currentCoverPath,
  onFileChange,
}: {
  currentCoverPath?: string | null;
  onFileChange: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(
    currentCoverPath ?? null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileChange(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(currentCoverPath ?? null);
    }
  };

  return (
    <div className={styles['field-group']}>
      <label className={styles['field-label']}>Обложка</label>
      <div
        className={styles['cover-upload']}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Обложка"
            className={styles['cover-preview']}
          />
        ) : (
          <div className={styles['cover-placeholder']}>
            <span>Нажмите для загрузки</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers – build request bodies
// ---------------------------------------------------------------------------

interface FormState {
  title: string;
  description: string;
  isbn: string;
  bbk: string;
  udk: string;
  source: string;
  year: string;
  isAvailable: boolean;
  isReviewable: boolean;
  languageId: number | null;
  languageName: string;
  countryId: number | null;
  countryName: string;
  publisherId: number | null;
  publisherName: string;
  coverFile: File | null;
  personFilters: PersonRoleFilterRequest[];
}

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  isbn: '',
  bbk: '',
  udk: '',
  source: '',
  year: '',
  isAvailable: true,
  isReviewable: false,
  languageId: null,
  languageName: '',
  countryId: null,
  countryName: '',
  publisherId: null,
  publisherName: '',
  coverFile: null,
  personFilters: [],
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const BookUnit: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const isNew = bookId === 'new';
  const { user } = useStore();
  const id = bookId && !isNew ? parseInt(bookId, 10) : null;

  const {
    data: book,
    isLoading,
    error,
  } = useBookDetails(id ?? 0, user?.userName ?? '');
  const { data: contents, refetch: refetchContents } = useBookContents(id);
  const unlinkMutation = useUnlinkContentFromBook();
  const linkMutation = useLinkContentToBook();
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();

  const { data: languages = [] } = useLanguages();
  const { data: countries = [] } = useCountries();
  const { data: roles = [] } = usePersonRoles();

  // Publishers – если у вас есть хук usePublishers, замените заглушку
  // const { data: publishers = [] } = usePublishers();
  // Для примера используем пустой массив; подключите реальный хук при необходимости
  const publishers: AutocompleteItem[] = [];

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showContentSearch, setShowContentSearch] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  // When book loads, initialise view mode
  useEffect(() => {
    if (isNew) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('edit');
      setForm(emptyForm());
    }
  }, [isNew]);

  useEffect(() => {
    if (book) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: book.title ?? '',
        description: book.description ?? '',
        isbn: book.isbn ?? '',
        bbk: (book as any).bbk ?? '',
        udk: (book as any).udk ?? '',
        source: (book as any).source ?? '',
        year: book.year != null ? String(book.year) : '',
        isAvailable: book.isAvailable,
        isReviewable: book.isReviewable,
        languageId: book.language?.id ?? null,
        languageName: book.language?.name ?? '',
        countryId: book.country?.id ?? null,
        countryName: book.country?.name ?? '',
        publisherId: book.publisher?.id ?? null,
        publisherName: book.publisher?.name ?? '',
        coverFile: null,
        personFilters: [],
      });
    }
  }, [book]);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('Название обязательно');
      return;
    }

    try {
      if (isNew) {
        if (!form.coverFile) {
          alert('Выберите обложку');
          return;
        }

        const coverBase64 = await fileToBase64(form.coverFile);

        const payload: CreateBookRequest = {
          title: form.title,
          description: form.description,
          isbn: form.isbn || null,
          bbk: form.bbk || null,
          udk: form.udk || null,
          source: form.source || null,
          year: form.year ? parseInt(form.year) : null,
          isAvailable: form.isAvailable,
          isReviewable: form.isReviewable,
          languageId: form.languageId!,
          countryId: form.countryId!,
          publisherId: form.publisherId,
          seriesId: null,
          coverBase64,
          coverContentType: form.coverFile.type,
          // coverFileName: form.coverFile.name,
          personFilters: form.personFilters,
        };

        const newId = await createMutation.mutateAsync(payload);
        navigate(`/books/${newId}`);
      } else {
        // Если новый файл выбран — конвертируем, иначе не передаём обложку
        const coverBase64 = form.coverFile
          ? await fileToBase64(form.coverFile)
          : null;

        const payload: UpdateBookRequest = {
          id: id!,
          title: form.title,
          description: form.description,
          isbn: form.isbn || null,
          isbnProvided: true,
          bbk: form.bbk || null,
          bbkProvided: true,
          udk: form.udk || null,
          udkProvided: true,
          source: form.source || null,
          sourceProvided: true,
          year: form.year ? parseInt(form.year) : null,
          yearProvided: true,
          isAvailable: form.isAvailable,
          isReviewable: form.isReviewable,
          languageId: form.languageId,
          countryId: form.countryId,
          publisherId: form.publisherId,
          publisherIdProvided: true,
          seriesId: null,
          seriesIdProvided: true,
          coverBase64,
          coverContentType: form.coverFile?.type ?? null,
          // coverFileName: form.coverFile?.name ?? null,
          personFilters: form.personFilters,
        };

        await updateMutation.mutateAsync({ id: id!, data: payload });
        setMode('view');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка сохранения');
    }
  };

  const handleCancel = () => {
    if (isNew) {
      navigate('/books');
    } else {
      // reset form to current book data
      if (book) {
        setForm({
          title: book.title ?? '',
          description: book.description ?? '',
          isbn: book.isbn ?? '',
          bbk: (book as any).bbk ?? '',
          udk: (book as any).udk ?? '',
          source: (book as any).source ?? '',
          year: book.year != null ? String(book.year) : '',
          isAvailable: book.isAvailable,
          isReviewable: book.isReviewable,
          languageId: book.language?.id ?? null,
          languageName: book.language?.name ?? '',
          countryId: book.country?.id ?? null,
          countryName: book.country?.name ?? '',
          publisherId: book.publisher?.id ?? null,
          publisherName: book.publisher?.name ?? '',
          coverFile: null,
          personFilters: [],
        });
      }
      setMode('view');
    }
  };

  // -------------------------------------------------------------------------
  // Content link / unlink
  // -------------------------------------------------------------------------

  const handleUnlinkContent = async (contentId: number) => {
    if (window.confirm('Удалить этот контент из книги?')) {
      try {
        await unlinkMutation.mutateAsync({ bookId: id!, contentId });
        refetchContents();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка');
      }
    }
  };

  const handleAddContent = async (content: ContentDto) => {
    if (window.confirm(`Добавить контент "${content.title}" к этой книге?`)) {
      try {
        await linkMutation.mutateAsync({
          bookId: id!,
          contentId: content.id,
          data: {
            bookId: id!,
            contentId: content.id,
            order: (contents?.length || 0) + 1,
          },
        });
        setShowContentSearch(false);
        refetchContents();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка');
      }
    }
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className={styles['loading']}>Загрузка...</div>;
  if (error || (!book && !isNew))
    return <div className={styles['error']}>Книга не найдена</div>;

  const isEditing = mode === 'edit';

  // -------------------------------------------------------------------------
  // JSX
  // -------------------------------------------------------------------------

  return (
    <div className={styles['book-unit']}>
      {/* Header */}
      <div className={styles['book-unit-header']}>
        <button
          onClick={() => navigate('/books')}
          className={styles['btn btn-secondary']}
        >
          <ArrowLeft /> Назад к списку
        </button>
        <h2>{isNew ? 'Новая книга' : book?.title}</h2>
        <div className={styles['header-actions']}>
          {!isNew && !isEditing && (
            <button
              className={styles['btn btn-primary']}
              onClick={() => setMode('edit')}
            >
              Редактировать
            </button>
          )}
          {isEditing && (
            <>
              <button
                className={styles['btn btn-secondary']}
                onClick={handleCancel}
                disabled={isSaving}
              >
                Отмена
              </button>
              <button
                className={styles['btn btn-primary']}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Сохранение...' : isNew ? 'Создать' : 'Сохранить'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className={styles['book-metadata']}>
        <div className={styles['metadata-section']}>
          <h3>Основная информация</h3>

          {isEditing ? (
            <div className={styles['edit-form']}>
              {/* Cover */}
              <CoverUpload
                currentCoverPath={book?.coverUri ?? null}
                onFileChange={(file) => set('coverFile', file)}
              />

              {/* Title */}
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Название *</label>
                <input
                  className={styles['field-input']}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Название книги"
                />
              </div>

              {/* Description */}
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Описание</label>
                <textarea
                  className={styles['field-textarea']}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={4}
                  placeholder="Описание книги"
                />
              </div>

              {/* ISBN / BBK / UDK / Source / Year */}
              <div className={styles['fields-row']}>
                <div className={styles['field-group']}>
                  <label className={styles['field-label']}>ISBN</label>
                  <input
                    className={styles['field-input']}
                    value={form.isbn}
                    onChange={(e) => set('isbn', e.target.value)}
                    placeholder="ISBN"
                  />
                </div>
                <div className={styles['field-group']}>
                  <label className={styles['field-label']}>Год</label>
                  <input
                    className={styles['field-input']}
                    type="number"
                    value={form.year}
                    onChange={(e) => set('year', e.target.value)}
                    placeholder="Год"
                  />
                </div>
              </div>

              <div className={styles['fields-row']}>
                <div className={styles['field-group']}>
                  <label className={styles['field-label']}>ББК</label>
                  <input
                    className={styles['field-input']}
                    value={form.bbk}
                    onChange={(e) => set('bbk', e.target.value)}
                    placeholder="ББК"
                  />
                </div>
                <div className={styles['field-group']}>
                  <label className={styles['field-label']}>УДК</label>
                  <input
                    className={styles['field-input']}
                    value={form.udk}
                    onChange={(e) => set('udk', e.target.value)}
                    placeholder="УДК"
                  />
                </div>
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Источник</label>
                <input
                  className={styles['field-input']}
                  value={form.source}
                  onChange={(e) => set('source', e.target.value)}
                  placeholder="Источник"
                />
              </div>

              {/* Language autocomplete */}
              <AutocompleteField
                label="Язык"
                selectedId={form.languageId}
                selectedName={form.languageName}
                items={languages}
                placeholder="Введите язык..."
                onSelect={(item) => {
                  set('languageId', item.id);
                  set('languageName', item.name);
                }}
                onClear={() => {
                  set('languageId', null);
                  set('languageName', '');
                }}
              />

              {/* Country autocomplete */}
              <AutocompleteField
                label="Страна"
                selectedId={form.countryId}
                selectedName={form.countryName}
                items={countries}
                placeholder="Введите страну..."
                onSelect={(item) => {
                  set('countryId', item.id);
                  set('countryName', item.name);
                }}
                onClear={() => {
                  set('countryId', null);
                  set('countryName', '');
                }}
              />

              {/* Publisher autocomplete */}
              <AutocompleteField
                label="Издательство"
                selectedId={form.publisherId}
                selectedName={form.publisherName}
                items={publishers}
                placeholder="Введите издательство..."
                onSelect={(item) => {
                  set('publisherId', item.id);
                  set('publisherName', item.name);
                }}
                onClear={() => {
                  set('publisherId', null);
                  set('publisherName', '');
                }}
              />

              {/* Flags */}
              <div className={styles['fields-row']}>
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => set('isAvailable', e.target.checked)}
                  />
                  Доступно
                </label>
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={form.isReviewable}
                    onChange={(e) => set('isReviewable', e.target.checked)}
                  />
                  Рецензируется
                </label>
              </div>

              {/* Persons */}
              <PersonFilter
                value={form.personFilters}
                roles={roles}
                onChange={(pf) => set('personFilters', pf)}
              />
            </div>
          ) : (
            <div className={styles['metadata-grid']}>
              {book?.coverUri && (
                <div
                  className={styles['metadata-item']}
                  style={{ gridColumn: '1 / -1' }}
                >
                  <img
                    src={book.coverUri}
                    alt="Обложка"
                    style={{
                      maxHeight: 200,
                      borderRadius: 8,
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}
              <MetaRow label="ID" value={book?.id} />
              <MetaRow label="Название" value={book?.title} />
              <MetaRow label="Описание" value={book?.description} />
              <MetaRow label="ISBN" value={book?.isbn} />
              <MetaRow label="ББК" value={(book as any)?.bbk} />
              <MetaRow label="УДК" value={(book as any)?.udk} />
              <MetaRow label="Источник" value={(book as any)?.source} />
              <MetaRow label="Год" value={book?.year} />
              <MetaRow label="Язык" value={book?.language?.name} />
              <MetaRow label="Страна" value={book?.country?.name} />
              <MetaRow label="Издательство" value={book?.publisher?.name} />
              {/* <MetaRow label="Авторы" value={book?.authors.join(', ')} /> */}
              <MetaRow
                label="Темы"
                value={book?.themes.map((t) => t.name).join(', ')}
              />
              <MetaRow label="Доступно" value={book?.isAvailable ? '✓' : '✗'} />
              <MetaRow
                label="Рецензируется"
                value={book?.isReviewable ? '✓' : '✗'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Contents – only for existing books */}
      {!isNew && (
        <div className={styles['contents-section']}>
          <div className={styles['contents-header']}>
            <h3>Контенты в книге ({contents?.length || 0})</h3>
            <button
              onClick={() => setShowContentSearch(true)}
              className={styles['btn btn-primary']}
            >
              + Добавить контент
            </button>
          </div>

          <table className={styles['contents-table']}>
            <thead>
              <tr>
                <th>Id</th>
                <th>Название</th>
                <th>Тип</th>
                <th>Авторы</th>
                <th>Темы</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {contents?.map((content) => (
                <tr key={content.id}>
                  {/* <td>{index}</td> */}
                  <td>{content.id}</td>
                  <td>{content.title}</td>
                  <td>{content.contentType}</td>
                  <td>{content.authors.join(', ')}</td>
                  <td>{content.themes.map((t) => t.name).join(', ')}</td>
                  <td>
                    <button
                      onClick={() => handleUnlinkContent(content.id)}
                      className={styles['btn btn-danger btn-sm']}
                      disabled={unlinkMutation.isPending}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Files – only for existing books */}
      {!isNew && (
        <div className={styles['files-section']}>
          <h3>Файлы книги</h3>
          <BookFileManagement bookId={id!} bookTitle={book?.title ?? ''} />
        </div>
      )}

      {/* Content search popup */}
      {showContentSearch && (
        <ContentSearchPopup
          onClose={() => setShowContentSearch(false)}
          onSelectContent={handleAddContent}
          currentBookId={id!}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Small helper for view-mode rows
// ---------------------------------------------------------------------------

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles['metadata-item']}>
      <label>{label}:</label>
      <span>{value ?? '—'}</span>
    </div>
  );
}
