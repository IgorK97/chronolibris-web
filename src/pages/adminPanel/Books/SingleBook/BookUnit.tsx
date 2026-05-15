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
import { createPortal } from 'react-dom';
import { usePublishers } from '@/api/publishers';

interface SelectedPerson {
  uid: string;
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
  // console.log('ITEM_TYPE: ', itemType);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<SelectedPerson[]>(() => {
    if (initialPersons && initialPersons.length > 0)
      return initialPersons
        .filter((p) => {
          const role = roles.find((r) => r.id == p.roleId);
          if (!role) return false;
          if (itemType === 'book')
            return Number(role.kind) === 2 || Number(role.kind) === 3;
          if (itemType === 'content')
            return Number(role.kind) === 1 || Number(role.kind) === 3;
          return true;
        })
        .map((p) => ({ ...p, uid: `${p.id}-${p.roleId}` }));
    else if (value && value.length > 0)
      return value.flatMap((pf) =>
        pf.personIds.map((id) => ({
          id,
          name: `#${id}`,
          roleId: pf.roleId,
          uid: `${id}-${pf.roleId}`,
        }))
      );
    else return [];
  });
  const [showDropDown, setShowDropDown] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  const { data: suggestions = [] } = usePersonSuggestions(debouncedInput);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPersons && initialPersons.length > 0 && roles.length > 0) {
      const filtered = initialPersons
        .filter((p) => {
          const role = roles.find((r) => r.id == p.roleId);
          if (!role) return false;
          if (itemType === 'book')
            return Number(role.kind) === 2 || Number(role.kind) === 3;
          if (itemType === 'content')
            return Number(role.kind) === 1 || Number(role.kind) === 3;
          return true;
        })
        .map((p) => ({ ...p, uid: `${p.id}-${p.roleId}` }));
      setSelected(filtered);
    }
  }, [initialPersons, roles, itemType]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node))
        setShowDropDown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changePersons = (next: SelectedPerson[]) => {
    setSelected(next);
    const grouped = new Map<number, number[]>();
    for (const p of next) {
      if (p.roleId == null) continue;
      if (!grouped.has(p.roleId)) grouped.set(p.roleId, []);
      grouped.get(p.roleId)!.push(p.id);
    }
    onChange(
      [...grouped].map(([roleId, personIds]) => ({
        //распыление и деструктуризация, возвращает объект
        roleId,
        personIds,
      }))
    );
  };

  const handleSelect = (person: PersonSuggestionDto) => {
    if (selected.some((p) => p.id === person.id && p.roleId === null)) {
      setInput('');
      setShowDropDown(false);
      return;
    }
    changePersons([
      ...selected,
      {
        id: person.id,
        name: person.name,
        roleId: null,
        uid: `${person.id}-null`,
      },
    ]);
    setInput('');
    setShowDropDown(false);
  };

  const handleRoleChange = (uid: string, personId: number, roleId: number) => {
    const duplicate = selected.find(
      (p) => p.id === personId && p.roleId === roleId
    );
    if (duplicate) {
      return;
    }
    changePersons(selected.map((p) => (p.uid === uid ? { ...p, roleId } : p)));
  };

  const handleRemove = (uid: string) => {
    changePersons(selected.filter((p) => p.uid !== uid));
  };
  // console.log('PERSON FILTER - RENDER', selected.length);
  return (
    <div className={styles['field-group']}>
      <label className={styles['field-label']}>Персоналии</label>

      {selected.length > 0 && (
        <div className={styles['person-list']}>
          {selected.map((p) => (
            <div key={p.uid} className={styles['person-row']}>
              <span className={styles['person-name']}>{p.name}</span>
              <select
                className={styles['role-select']}
                value={p.roleId ?? ''}
                onChange={(e) =>
                  !readOnly &&
                  handleRoleChange(p.uid, p.id, Number(e.target.value))
                }
                disabled={readOnly}
              >
                <option value="" disabled>
                  Выберите роль
                </option>
                {roles
                  .filter((pr) => {
                    // console.log(pr.kind);
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
                  onClick={() => handleRemove(p.uid)}
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
            {filtered.slice(0, 10).map((item) => (
              <li
                key={item.id}
                className={`${styles['autocomplete-item']} ${
                  item.id === selectedId
                    ? styles['autocomplete-item-selected']
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

const validateRealFileType = async (file: File): Promise<boolean> => {
  const signatures: Record<string, string> = {
    ffd8ff: 'image/jpeg',
    '89504e47': 'image/png',
    '52494646': 'image/webp',
  };
  const header = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arr = new Uint8Array(reader.result as ArrayBuffer).subarray(0, 4);
      let headerValue = '';
      for (let i = 0; i < arr.length; i++) {
        headerValue += arr[i].toString(16);
      }
      resolve(headerValue);
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
  return Object.keys(signatures).some((sig) => header.startsWith(sig));
};

function CoverUpload({
  currentCoverPath,
  onFileChange,
  onDeleteCover,
}: {
  currentCoverPath?: string | null;
  onFileChange: (file: File | null) => void;
  onDeleteCover: () => void;
}) {
  const [preview, setPreview] = useState(storageUrl(currentCoverPath));
  const handleRemove = () => {
    setPreview(null);
    onFileChange(null);
    onDeleteCover();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    maxSize: 1.5 * 1024 * 1024,
    maxFiles: 1,
    onDrop: async ([file]) => {
      if (!file) return;

      const isValid = await validateRealFileType(file);

      if (isValid) {
        onFileChange(file);
        setPreview(URL.createObjectURL(file));
      } else {
        alert('Файл не похож на изображение');
      }
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div {...getRootProps()} className={styles['cover-upload']}>
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} className={styles['cover-preview']} />
        ) : (
          <span>
            {isDragActive
              ? 'Отпустите файл...'
              : 'Нажмите или перетащите (jpeg, png, webp, до 1 МБ)'}
          </span>
        )}
      </div>
      {preview && (
        <button onClick={handleRemove}>
          <X style={{ cursor: 'pointer', color: 'red' }} />
        </button>
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
  deleteCoverCommand: boolean;
  hasHistoricalVersions: boolean;
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
  deleteCoverCommand: false,
  hasHistoricalVersions: true,
});

const VALIDATION_RULES = {
  title: /^[\p{L}\d\p{P}\s№§]{1,500}$/u,
  description: /^[^]{120,5000}$/u,
  year: { min: -10000, max: new Date().getFullYear() + 1 },
  isbn: /(?:(?=(?:[^0-9]*[0-9]){10}(?:(?:[^0-9]*[0-9]){3})?$)[\d-]+)?$/,
  bbk: /^[\d\p{L}[\]()+:/="'*.]{0,255}$/u,
  udk: /^[\d\p{L}[\]()+:/="'*.]{0,255}$/u,
  source: /^[\d\s\p{L};/\\:?&=%#[\]()._,—–№§-]{0,2000}$/u,
};

export const BookUnit: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const isNew = bookId === 'new';
  const { user } = useStore();
  const id = bookId && !isNew ? parseInt(bookId, 10) : null;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const { data: publishersData = [] } = usePublishers();

  const publishers = useMemo(
    () => publishersData.map((p) => ({ id: p.id, name: p.name })),
    [publishersData]
  );
  const {
    data: book,
    isLoading,
    error,
  } = useBookDetails(id ?? 0, user?.userName ?? '', true, !!id);
  useEffect(() => {
    if (book) {
      document.title = `${book.title} — Редактирование`;
    }
  }, [book]);
  const { data: contents, refetch: refetchContents } = useBookContents(id);
  // console.log(contents);
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

  const [initialPersons, setInitialPersons] = useState<SelectedPerson[]>([]);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showContentSearch, setShowContentSearch] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const validate = useCallback(
    (data: FormState) => {
      const newErrors: Record<string, string> = {};

      if (!VALIDATION_RULES.title.test(data.title)) {
        newErrors.title = `Не более 500 символов, буквы, цифры, пунктуация, пробелы, символы №§`;
      }

      if (!VALIDATION_RULES.description.test(data.description)) {
        newErrors.description = `Не более 5000 символов и не менее 120`;
      }

      if (!VALIDATION_RULES.isbn.test(data.isbn)) {
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

      if (!VALIDATION_RULES.source.test(data.source)) {
        newErrors.source =
          'Буквы, цифры, пробелы, символы ;/\\:?&=%#[]-.,_—№§. Не более 500 символов';
      }

      if (!data.languageId) newErrors.language = 'Выберите язык';
      if (!data.countryId) newErrors.country = 'Выберите страну';
      // if (isNew && !data.coverFile) newErrors.cover = 'Обложка обязательна';

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [isNew]
  );

  const isChanged = useMemo(() => {
    // console.log('USEEFFECT - ISCHANGED - 1');
    if (isNew) return true;
    // console.log('USEEFFECT - ISCHANGED - 2');

    if (!book) return false;
    // console.log('USEEFFECT - ISCHANGED - 3', form.deleteCoverCommand);

    return (
      form.title.trim() !== (book.title ?? '') ||
      form.description.trim() !== (book.description ?? '') ||
      form.isbn !== (book.isbn ?? '') ||
      form.year !== (book.year != null ? String(book.year) : '') ||
      form.source.trim() !== (book.source ?? '') ||
      form.languageId !== (book.language?.id ?? null) ||
      form.countryId !== (book.country?.id ?? null) ||
      form.publisherId !== (book.publisher?.id ?? null) ||
      form.isAvailable !== book.isAvailable ||
      form.isReviewable !== book.isReviewable ||
      form.hasHistoricalVersions !== book.hasHistoricalVersions ||
      form.bbk !== (book.bbk ?? '') ||
      form.udk !== (book.udk ?? '') ||
      form.coverFile !== null ||
      form.deleteCoverCommand === true ||
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
    // console.log('useEffect: TUTA-1');

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
      // console.log('BOOK_PARTS: ', book.participants);
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
        deleteCoverCommand: false,
        personFilters: (book.participants ?? []).map((group) => ({
          roleId: group.role,
          personIds: group.persons.map((p) => p.id),
        })),
        hasHistoricalVersions: book.hasHistoricalVersions,
      });
      const persons: SelectedPerson[] = (book?.participants ?? []).flatMap(
        (group) =>
          group.persons.map((p) => ({
            id: p.id,
            name: p.fullName,
            roleId: group.role,
            uid: `${p.id}-${group.role}`,
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
        const coverBase64 = form.coverFile
          ? await fileToBase64(form.coverFile)
          : null;
        const payload: CreateBookRequest = {
          title: form.title.trim(),
          description: form.description.trim(),
          isbn: form.isbn || null,
          bbk: form.bbk || null,
          udk: form.udk || null,
          source: form.source.trim() || null,
          year: form.year ? parseInt(form.year) : null,
          isAvailable: form.isAvailable,
          isReviewable: form.isReviewable,
          languageId: form.languageId!,
          countryId: form.countryId!,
          publisherId: form.publisherId,
          coverBase64,
          coverContentType: form.coverFile?.type ?? null,
          personFilters: clearPersonFilters,
          hasHistoricalVersions: form.hasHistoricalVersions,
        };

        const newId = await createMutation.mutateAsync(payload);
        setForm(emptyForm());
        setMode('view');
        navigate(`/books/${newId}`);
        setGlobalError('');
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
          deleteCoverCommand: form.deleteCoverCommand,
          hasHistoricalVersions: form.hasHistoricalVersions,
        };

        await updateMutation.mutateAsync({ id: id!, data: payload });
        setMode('view');
        setGlobalError('');
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
          deleteCoverCommand: false,
          personFilters: (book.participants ?? []).map((group) => ({
            roleId: group.role,
            personIds: group.persons.map((p) => p.id),
          })),
          hasHistoricalVersions: book.hasHistoricalVersions,
        });
      }
      setMode('view');
      setGlobalError('');
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
  // console.log('DATA: ', isSaving, !isValid, !isChanged);
  // console.log('ERRORS: ', errors);
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
                onDeleteCover={() => {
                  console.log('qwerty');
                  set('deleteCoverCommand', true);
                }}
              />
              <ErrorMsg text={errors.cover} />

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Название</label>
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
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={form.hasHistoricalVersions}
                    onChange={(e) =>
                      set('hasHistoricalVersions', e.target.checked)
                    }
                  />
                  С разными версиями текста
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
                <div className={styles['cover-placeholder']}>
                  <div className={styles['image-placeholder']}>
                    <span className={styles['image-placeholder-title']}>
                      {book?.title}
                    </span>
                  </div>
                </div>
              )}

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Название</label>
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
                <label className={styles['checkbox-label']}>
                  <input
                    type="checkbox"
                    checked={form.hasHistoricalVersions}
                    readOnly
                    onChange={() => {}}
                  />
                  С разными версиями текста
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

      {showContentSearch &&
        createPortal(
          <ContentSearchPopup
            onClose={() => setShowContentSearch(false)}
            onSelectContent={handleAddContent}
            currentBookId={id!}
          />,
          document.body
        )}
    </div>
  );
};
