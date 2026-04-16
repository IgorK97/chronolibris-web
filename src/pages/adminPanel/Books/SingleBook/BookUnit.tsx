/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useDropzone } from 'react-dropzone';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useBookContents,
  useCreateBook,
  useUpdateBook,
  useBookDetails,
} from '@/api/books';
import { useLanguages, useCountries } from '@/api/references';
import { usePersonRoles, usePersonSuggestions } from '@api/searchReference';
import type {
  PersonRoleDto,
  PersonRoleFilterRequest,
  PersonSuggestionDto,
} from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import type { ContentDto, CreateBookRequest, UpdateBookRequest } from '@/types';
import { ContentSearchPopup } from './ContentSearchPopup';
import styles from './BookUnit.module.css';
import { ArrowLeft, X } from 'lucide-react';
import { useStore } from '@/stores/globalStore';
import { fileToBase64, storageUrl } from '@/utils';
import { ContentList } from '@/components/Contents/ContentList';
import { BookFileManagement } from './BookFileManagement';
import { ErrorMsg } from '@/components';
import { AlertDialog } from '@/components/dialogs/AlertDialog';
import { useLinkBookToContent, useUnlinkBookFromContent } from '@/api/contents';

interface SelectedPerson {
  id: number;
  name: string;
  roleId: number | null;
}

interface AutocompleteItem {
  id: number;
  name: string;
}

function PersonFilter({
  value,
  roles,
  itemType,
  onChange,
  initialPersons,
  readOnly = false,
}: {
  value: PersonRoleFilterRequest[];
  roles: PersonRoleDto[];
  itemType?: 'book' | 'content';
  onChange: (v: PersonRoleFilterRequest[]) => void;
  initialPersons?: SelectedPerson[];
  readOnly?: boolean;
}) {
  console.log('ITEM_TYPE: ', itemType);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<SelectedPerson[]>(() => {
    if (initialPersons && initialPersons.length > 0)
      return initialPersons.filter(
        (p) => roles.find((r) => r.id == p.roleId)?.kind == 2
      );
    return value.flatMap((pf) =>
      pf.personIds.map((id) => ({ id, name: `#${id}`, roleId: pf.roleId }))
    );
  });
  const [showDropDown, setShowDropDown] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  const { data: suggestions = [] } = usePersonSuggestions(debouncedInput);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPersons && initialPersons.length > 0) {
      setSelected(
        initialPersons.filter(
          (p) => roles.find((r) => r.id == p.roleId)?.kind == 2
        )
      );
    }
  }, [initialPersons]);

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
                onChange={(e) =>
                  !readOnly && handleRoleChange(p.id, Number(e.target.value))
                }
                disabled={readOnly}
              >
                <option value="" disabled>
                  Выберите роль
                </option>
                {roles
                  .filter((pr) => {
                    console.log(pr.kind);
                    if (itemType === 'book')
                      return pr.kind === 2 || pr.kind === 3;
                    if (itemType === 'content')
                      return pr.kind === 1 || pr.kind === 3;
                    return true;
                  })
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
              {!readOnly && (
                <button
                  type="button"
                  className={styles['remove-btn']}
                  onClick={() => handleRemove(p.id)}
                  aria-label="Удалить"
                >
                  <X />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
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
      )}
    </div>
  );
}

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
              <X style={{ cursor: 'pointer' }} />
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

function CoverUpload({
  currentCoverPath,
  onFileChange,
}: {
  currentCoverPath?: string | null;
  onFileChange: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState(storageUrl(currentCoverPath));
  console.log(
    'Current cover path:',
    currentCoverPath,
    'Resolved URL:',
    preview
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      onFileChange(file);
      setPreview(URL.createObjectURL(file));
    },
  });

  return (
    <div {...getRootProps()} className={styles['cover-upload']}>
      <input {...getInputProps()} />
      {preview ? (
        <img src={preview} className={styles['cover-preview']} />
      ) : (
        <span>
          {isDragActive ? 'Отпустите файл...' : 'Нажмите или перетащите'}
        </span>
      )}
    </div>
  );
}

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

const VALIDATION_RULES = {
  // isbn: /^(?=(?:\D?\d){10}(?:(?:\D?\d){3})?$)[\d-]+$/,
  isbn: /^(?=(?:\D?\d){10}(?:(?:\D?\d){3})?$)[\d-]+$/,
  title: { min: 1, max: 500 },
  description: { min: 100, max: 2000 },
  year: { min: -5000, max: 3000 },
  sourceMax: 500,
};

export const BookUnit: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const isNew = bookId === 'new';
  const { user } = useStore();
  const id = bookId && !isNew ? parseInt(bookId, 10) : null;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  const {
    data: book,
    isLoading,
    error,
  } = useBookDetails(id ?? 0, user?.userName ?? '', true, !!id);
  const { data: contents, refetch: refetchContents } = useBookContents(id);
  const unlinkMutation = useUnlinkBookFromContent();
  const linkMutation = useLinkBookToContent();
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();

  const { data: languages = [] } = useLanguages();
  const { data: countries = [] } = useCountries();
  const { data: roles = [] } = usePersonRoles();

  const [deletingContentId, setDeletingContentId] = useState(0);
  // const [addingContentId, setAddingContentId] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const publishers: AutocompleteItem[] = [];
  const [initialPersons, setInitialPersons] = useState<SelectedPerson[]>([]);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showContentSearch, setShowContentSearch] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const validate = useCallback(
    (data: FormState) => {
      const newErrors: Record<string, string> = {};

      if (
        !data.title.trim() ||
        data.title.length > VALIDATION_RULES.title.max
      ) {
        newErrors.title = `Не более ${VALIDATION_RULES.title.max} символов`;
      }

      if (
        data.description.length < VALIDATION_RULES.description.min ||
        data.description.length > VALIDATION_RULES.description.max
      ) {
        newErrors.description = `От ${VALIDATION_RULES.description.min} до ${VALIDATION_RULES.description.max} символов`;
      }

      if (data.isbn && !VALIDATION_RULES.isbn.test(data.isbn)) {
        newErrors.isbn = 'Некорректный формат ISBN';
      }

      if (data.year) {
        const y = parseInt(data.year, 10);
        if (
          isNaN(y) ||
          y < VALIDATION_RULES.year.min ||
          y > VALIDATION_RULES.year.max
        ) {
          newErrors.year = `Год от ${VALIDATION_RULES.year.min} до ${VALIDATION_RULES.year.max}`;
        }
      }

      if (data.source.length > VALIDATION_RULES.sourceMax) {
        newErrors.source = `Источник не более ${VALIDATION_RULES.sourceMax} символов`;
      }

      if (!data.languageId) newErrors.language = 'Выберите язык';
      if (!data.countryId) newErrors.country = 'Выберите страну';
      if (isNew && !data.coverFile) newErrors.cover = 'Обложка обязательна';

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [isNew]
  );

  const isChanged = useMemo(() => {
    if (isNew) return true;
    if (!book) return false;

    return (
      form.title !== (book.title ?? '') ||
      form.description !== (book.description ?? '') ||
      form.isbn !== (book.isbn ?? '') ||
      form.year !== (book.year != null ? String(book.year) : '') ||
      form.source !== (book.source ?? '') ||
      form.languageId !== (book.language?.id ?? null) ||
      form.countryId !== (book.country?.id ?? null) ||
      form.publisherId !== (book.publisher?.id ?? null) ||
      form.isAvailable !== book.isAvailable ||
      form.isReviewable !== book.isReviewable ||
      form.coverFile !== null ||
      JSON.stringify(form.personFilters) !==
        JSON.stringify(
          (book.participants ?? []).map((p) => ({
            roleId: p.role,
            personIds: p.persons.map((pers) => pers.id),
          }))
        )
    );
  }, [form, book, isNew]);

  useEffect(() => {
    if (mode === 'edit') {
      validate(form);
    }
  }, [form, mode, validate]);

  useEffect(() => {
    if (isNew) {
      setMode('edit');
      setForm(emptyForm());
    }
  }, [isNew]);

  useEffect(() => {
    if (book) {
      console.log('BOOK_PARTS: ', book.participants);
      setForm({
        title: book.title ?? '',
        description: book.description ?? '',
        isbn: book.isbn ?? '',
        bbk: book.bbk ?? '',
        udk: book.udk ?? '',
        source: book.source ?? '',
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
        personFilters: (book.participants ?? []).map((group) => ({
          roleId: group.role,
          personIds: group.persons.map((p) => p.id),
        })),
      });
      const persons: SelectedPerson[] = (book?.participants ?? []).flatMap(
        (group) =>
          group.persons.map((p) => ({
            id: p.id,
            name: p.fullName,
            roleId: group.role,
          }))
      );
      setInitialPersons(persons);
    }
  }, [book]);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleSave = async () => {
    if (!validate(form)) return;

    try {
      const clearPersonFilters = form.personFilters.filter(
        (f) => f.roleId !== null && f.personIds.length > 0
      );
      if (isNew) {
        const coverBase64 = await fileToBase64(form.coverFile!);
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
          coverBase64,
          coverContentType: form.coverFile!.type,
          personFilters: clearPersonFilters,
        };

        const newId = await createMutation.mutateAsync(payload);
        navigate(`/books/${newId}`);
      } else {
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
          coverBase64,
          coverContentType: form.coverFile?.type ?? null,
          personFilters: clearPersonFilters,
        };

        await updateMutation.mutateAsync({ id: id!, data: payload });
        setMode('view');
      }
    } catch (err: any) {
      setGlobalError(err.response?.data?.message || 'Ошибка!');
    }
  };

  const handleCancel = () => {
    if (isNew) {
      navigate('/books');
    } else {
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
          personFilters: (book.participants ?? []).map((group) => ({
            roleId: group.role,
            personIds: group.persons.map((p) => p.id),
          })),
        });
      }
      setMode('view');
    }
  };

  const handleUnlinkContent = async () => {
    await unlinkMutation.mutateAsync({
      bookId: id!,
      contentId: deletingContentId,
    });
    refetchContents();
    setDeleteModalOpen(false);
  };

  const handleAddContent = async (content: ContentDto) => {
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
    // setDeleteModalOpen(false);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isValid = Object.keys(errors).length === 0;

  if (isLoading) return <div className={styles['loading']}>Загрузка...</div>;
  if (error || (!book && !isNew))
    return <div className={styles['error']}>Книга не найдена</div>;

  const isEditing = mode === 'edit';

  return (
    <div className={styles['book-unit']}>
      <div className={styles['book-unit-header']}>
        <button onClick={() => navigate(-1)}>
          <ArrowLeft style={{ cursor: 'pointer' }} /> Назад
        </button>
        <h2>{isNew ? 'Новая книга' : book?.title}</h2>
        <ErrorMsg text={globalError} />

        {!isNew && (
          <div>
            <button
              className={`${styles['btn']} ${styles['btn-update']}`}
              onClick={() => navigate(`/book/${book!.id}`)}
            >
              Перейти к странице книги
            </button>
          </div>
        )}
        <div className={styles['header-actions']}>
          {!isNew && !isEditing && (
            <button
              className={`${styles['btn']} ${styles['btn-update']}`}
              onClick={() => setMode('edit')}
            >
              Редактировать
            </button>
          )}
          {isEditing && (
            <>
              <button
                className={`${styles['btn']} ${styles['btn-danger']}`}
                onClick={handleCancel}
                disabled={isSaving}
              >
                Отмена
              </button>
              <button
                className={`${styles['btn']} ${styles['btn-update']}`}
                onClick={handleSave}
                disabled={isSaving || !isValid || !isChanged}
              >
                {isSaving ? 'Сохранение...' : isNew ? 'Создать' : 'Сохранить'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles['book-metadata']}>
        <div className={styles['metadata-section']}>
          <h3>Основная информация о книге {book?.id}</h3>

          {isEditing ? (
            <div className={styles['edit-form']}>
              <CoverUpload
                currentCoverPath={book?.coverUri ?? null}
                onFileChange={(file) => set('coverFile', file)}
              />
              <ErrorMsg text={errors.cover} />

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Название *</label>
                <input
                  className={styles['field-input']}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Название книги"
                />
                <ErrorMsg text={errors.title} />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Описание</label>
                <textarea
                  className={styles['field-textarea']}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={4}
                  placeholder="Описание книги"
                />
                <ErrorMsg text={errors.description} />
              </div>

              <div className={styles['fields-row']}>
                <div className={styles['field-group']}>
                  <label className={styles['field-label']}>ISBN</label>
                  <input
                    className={styles['field-input']}
                    value={form.isbn}
                    onChange={(e) => set('isbn', e.target.value)}
                    placeholder="ISBN"
                  />
                  <ErrorMsg text={errors.isbn} />
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
                  <ErrorMsg text={errors.year} />
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
                <ErrorMsg text={errors.source} />
              </div>

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
              <ErrorMsg text={errors.language} />

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
              <ErrorMsg text={errors.country} />

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
                  Можно оценивать
                </label>
              </div>

              <PersonFilter
                value={form.personFilters}
                roles={roles}
                itemType="book"
                onChange={(pf) => set('personFilters', pf)}
                initialPersons={initialPersons}
              />
            </div>
          ) : (
            <div className={styles['edit-form']}>
              {book?.coverUri ? (
                <div className={styles['field-group']}>
                  <label className={styles['field-label']}>Обложка</label>
                  <div
                    className={styles['cover-upload']}
                    style={{ cursor: 'default' }}
                  >
                    <img
                      src={storageUrl(book.coverUri) ?? ''}
                      alt="Обложка"
                      className={styles['cover-preview']}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles['image-placeholder']}>
                  <span className={styles['image-placeholder-title']}>
                    {book?.title}
                  </span>
                </div>
              )}

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Название *</label>
                <input
                  className={styles['field-input']}
                  value={form.title}
                  readOnly
                  placeholder="Название книги"
                />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Описание</label>
                <textarea
                  className={styles['field-textarea']}
                  value={form.description}
                  readOnly
                  rows={4}
                  placeholder="Описание книги"
                />
              </div>

              <div className={styles['fields-row']}>
                <div className={styles['field-group']}>
                  <label className={styles['field-label']}>ISBN</label>
                  <input
                    className={styles['field-input']}
                    value={form.isbn}
                    readOnly
                    placeholder="ISBN"
                  />
                </div>
                <div className={styles['field-group']}>
                  <label className={styles['field-label']}>Год</label>
                  <input
                    className={styles['field-input']}
                    value={form.year}
                    readOnly
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
                    readOnly
                    placeholder="ББК"
                  />
                </div>
                <div className={styles['field-group']}>
                  <label className={styles['field-label']}>УДК</label>
                  <input
                    className={styles['field-input']}
                    value={form.udk}
                    readOnly
                    placeholder="УДК"
                  />
                </div>
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Источник</label>
                <input
                  className={styles['field-input']}
                  value={form.source}
                  readOnly
                  placeholder="Источник"
                />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Язык</label>
                <input
                  className={styles['field-input']}
                  value={form.languageName}
                  readOnly
                  placeholder="Язык"
                />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Страна</label>
                <input
                  className={styles['field-input']}
                  value={form.countryName}
                  readOnly
                  placeholder="Страна"
                />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Издательство</label>
                <input
                  className={styles['field-input']}
                  value={form.publisherName}
                  readOnly
                  placeholder="Издательство"
                />
              </div>

              <div className={styles['fields-row']}>
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    readOnly
                    onChange={() => {}}
                  />
                  Доступно
                </label>
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={form.isReviewable}
                    readOnly
                    onChange={() => {}}
                  />
                  Можно оценивать
                </label>
              </div>

              <PersonFilter
                value={form.personFilters}
                roles={roles}
                itemType="book"
                onChange={() => {}}
                initialPersons={initialPersons}
                readOnly
              />
            </div>
          )}
        </div>
      </div>
      <AlertDialog
        description={`При необходимости его можно будет привязать заново`}
        open={deleteModalOpen}
        title={`Вы действительно хотите отвязать контент от книги?`}
        handleAccept={() => {
          handleUnlinkContent();
        }}
        handleReject={() => {
          setDeleteModalOpen(false);
          setDeletingContentId(0);
        }}
      />

      {!isNew && (
        <div className={styles['contents-section']}>
          <div className={styles['contents-header']}>
            <h3>Контенты в книге ({contents?.length || 0})</h3>
            <button
              onClick={() => setShowContentSearch(true)}
              className={`${styles['btn']} ${styles['btn-update']}`}
            >
              + Добавить контент
            </button>
          </div>

          <ContentList
            items={contents}
            renderActions={(content) => (
              <button
                onClick={() => {
                  setDeletingContentId(content.id);
                  setDeleteModalOpen(true);
                }}
                className={`${styles['btn']} ${styles['btn-danger']}`}
                disabled={unlinkMutation.isPending}
              >
                Отвязать
              </button>
            )}
            onTitleClick={(content) => navigate(`/contents/${content.id}/edit`)}
            additionalColumns={[
              { header: 'Тип', render: (c) => c.contentType },
            ]}
          />
        </div>
      )}

      {!isNew && (
        <div className={styles['files-section']}>
          <h3>Файлы книги</h3>
          <BookFileManagement bookId={id!} bookTitle={book?.title ?? ''} />
        </div>
      )}

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
