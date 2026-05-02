/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useContentById,
  useCreateContent,
  usePatchContent,
  useContentBooks,
} from '@/api/contents';
import { useLanguages, useCountries } from '@/api/references';
import { usePersonRoles, usePersonSuggestions } from '@api/searchReference';
import type {
  PersonRoleDto,
  PersonRoleFilter,
  PersonRoleFilterRequest,
  PersonSuggestionDto,
} from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { ThemeSelector } from '../../Themes/ThemeSelector';
import { ContentTagsManagement } from './ContentTagsManagement';
import type { ThemeDto } from '@/types';
import styles from './ContentUnit.module.css';
import { ArrowLeft, X } from 'lucide-react';
import { storageUrl } from '@/utils';
import { GenreChip } from '@/components/GenreChip';
import { ErrorMsg } from '@/components';

const DOCUMENT_TYPES = [
  { id: 1, name: 'Дневник', nature: 'Document' },
  { id: 2, name: 'Письмо', nature: 'Document' },
  { id: 3, name: 'Мемуары', nature: 'Document' },
  { id: 4, name: 'Автобиография', nature: 'Document' },
  { id: 5, name: 'Хроника', nature: 'Document' },
  { id: 6, name: 'Летопись', nature: 'Document' },
  { id: 7, name: 'Манифест', nature: 'Document' },
  { id: 8, name: 'Речь', nature: 'Document' },
  { id: 9, name: 'Указ', nature: 'Document' },
  { id: 10, name: 'Рассказ', nature: 'Work' },
  { id: 11, name: 'Роман', nature: 'Work' },
  { id: 12, name: 'Философский трактат', nature: 'Work' },
  { id: 13, name: 'Религиозный трактат', nature: 'Work' },
  { id: 14, name: 'Политический трактат', nature: 'Work' },
  { id: 15, name: 'Биография', nature: 'Work' },
  { id: 16, name: 'Путевые заметки', nature: 'Document' },
  { id: 17, name: 'Сборник', nature: 'Work' },
  { id: 18, name: 'Учебник', nature: 'Work' },
  { id: 19, name: 'Историческое исследование', nature: 'Work' },
  { id: 20, name: 'Монография', nature: 'Work' },
  { id: 21, name: 'Научная статья', nature: 'Work' },
  { id: 22, name: 'Другое', nature: 'Unknown' },
  { id: 23, name: 'Комментарий', nature: 'Work' },
  { id: 24, name: 'Священный текст', nature: 'Document' },
  { id: 25, name: 'Стенограмма', nature: 'Document' },
  { id: 26, name: 'Публицистика', nature: 'Work' },
];

interface SelectedPerson {
  uid: string;
  id: number;
  name: string;
  roleId: number | null;
}

interface FormState {
  title: string;
  description: string;
  contentTypeId: number;
  languageId: number;
  countryId: number;
  yearFrom: string;
  yearTo: string;
  personFilters: PersonRoleFilterRequest[];
}

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  contentTypeId: 0,
  languageId: 0,
  countryId: 0,
  yearFrom: '',
  yearTo: '',
  personFilters: [],
});

const VALIDATION_RULES = {
  title: /^[\p{L}\d\p{P}\s№§]{1,500}$/u,
  description: /^[^]{120,5000}$/u,
  year: { min: -10000, max: new Date().getFullYear() + 1 },
};

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
  // console.log('VALUE: ', value);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<SelectedPerson[]>(() => {
    if (initialPersons && initialPersons.length > 0)
      return initialPersons.map((p) => ({ ...p, uid: `${p.id}-${p.roleId}` }));
    return value.flatMap((pf) =>
      (pf.personIds ?? []).map((id) => ({
        id,
        name: `#${id}`,
        roleId: pf.roleId,
        uid: `${id}-${pf.roleId}`,
      }))
    );
  });
  const [showDropDown, setShowDropDown] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  const { data: suggestions = [] } = usePersonSuggestions(debouncedInput);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPersons && initialPersons.length > 0) {
      setSelected(
        initialPersons.map((p) => ({ ...p, uid: `${p.id}-${p.roleId}` }))
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
    if (selected.some((p) => p.id === person.id && p.roleId === null)) {
      setInput('');
      setShowDropDown(false);
      return;
    }
    emitChange([
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
    emitChange(selected.map((p) => (p.uid === uid ? { ...p, roleId } : p)));

    // emitChange(selected.map((p) => (p.id === personId ? { ...p, roleId } : p)));
  };

  const handleRemove = (uid: string) => {
    emitChange(selected.filter((p) => p.uid !== uid));
  };

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
                  <X style={{ cursor: 'pointer' }} />
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

export const ContentUnit: React.FC = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const isNew = !contentId || contentId === 'new';
  const id = contentId && !isNew ? parseInt(contentId, 10) : null;

  const { data: content, isLoading, error } = useContentById(id);
  const { data: languages = [] } = useLanguages();
  const { data: countries = [] } = useCountries();
  const contentTypes = DOCUMENT_TYPES;
  const { data: roles = [] } = usePersonRoles();
  const { data: associatedBooks = [], isLoading: isLoadingAssociatedBooks } =
    useContentBooks(id);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  const createMutation = useCreateContent();
  const patchMutation = usePatchContent();

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedThemes, setSelectedThemes] = useState<ThemeDto[]>([]);
  const [initialPersons, setInitialPersons] = useState<SelectedPerson[]>([]);

  const validate = useCallback((data: FormState) => {
    const newErrors: Record<string, string> = {};

    if (!VALIDATION_RULES.title.test(data.title)) {
      newErrors.title = `Не более 500 символов, буквы, цифры, пунктуация, пробелы, символы №§`;
    }

    if (!VALIDATION_RULES.description.test(data.description)) {
      newErrors.description = `Не более 5000 символов и не менее 120`;
    }

    if (data.yearFrom) {
      const y = parseInt(data.yearFrom, 10);
      if (
        isNaN(y) ||
        y < VALIDATION_RULES.year.min ||
        y > VALIDATION_RULES.year.max
      ) {
        newErrors.yearFrom = `Год от ${VALIDATION_RULES.year.min} до ${VALIDATION_RULES.year.max}`;
      }
    }

    if (data.yearTo) {
      const y = parseInt(data.yearTo, 10);
      if (
        isNaN(y) ||
        y < VALIDATION_RULES.year.min ||
        y > VALIDATION_RULES.year.max
      ) {
        newErrors.yearTo = `Год от ${VALIDATION_RULES.year.min} до ${VALIDATION_RULES.year.max}`;
      }
    }

    if (!data.languageId) newErrors.language = 'Выберите язык';
    if (!data.countryId) newErrors.country = 'Выберите страну';
    if (!data.contentTypeId) newErrors.contentTypeId = 'Выберите тип документа';
    if (
      !data.personFilters.filter(
        (pf) => pf.roleId == 1 && pf.personIds.length > 0
      )
    )
      newErrors.personFilters =
        'Укажите хотя бы одного автора (создателя контента)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

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
    if (content) {
      // console.log('CONTENT', content.participants);
      setForm({
        title: content.title ?? '',
        description: content.description ?? '',
        contentTypeId: content.contentTypeId ?? 0,
        languageId: content.languageId ?? 0,
        countryId: content.countryId ?? 0,
        yearFrom: content.yearFrom != null ? String(content.yearFrom) : '',
        yearTo: content.yearTo != null ? String(content.yearTo) : '',
        personFilters: (content.participants ?? []).map(
          (pf: PersonRoleFilter) => ({
            roleId: pf.roleId,
            personIds: pf.personIds,
          })
        ),
      });
      setSelectedThemes(content.themes ?? []);

      const persons: SelectedPerson[] = (content.participants ?? []).flatMap(
        (group: PersonRoleFilter) =>
          (group.personIds ?? []).map((p: number, index) => ({
            id: p,
            name:
              group.personNames && group.personNames.length > index
                ? group.personNames[index]
                : '',
            roleId: group.roleId,
            uid: `${p}-${group.roleId}`,
          }))
      );
      setInitialPersons(persons);
    }
  }, [content]);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const isChanged = useMemo(() => {
    if (isNew) return true;
    if (!content) return false;

    return (
      form.title !== (content.title ?? '') ||
      form.description !== (content.description ?? '') ||
      form.yearFrom !==
        (content.yearFrom != null ? String(content.yearFrom) : '') ||
      form.yearTo !== (content.yearTo != null ? String(content.yearTo) : '') ||
      form.languageId !== (content.languageId ?? null) ||
      form.countryId !== (content.countryId ?? null) ||
      form.contentTypeId !== (content.contentTypeId ?? null) ||
      JSON.stringify(form.personFilters) !==
        JSON.stringify(
          (content.participants ?? []).map((p) => ({
            roleId: p.roleId,
            personIds: p.personIds.map((pers) => pers),
          }))
        ) ||
      JSON.stringify(
        selectedThemes.map((theme) => ({
          id: theme.id,
        }))
      ) !==
        JSON.stringify(
          (content.themes ?? []).map((theme) => ({
            id: theme.id,
          }))
        )
    );
  }, [form, content, isNew, selectedThemes]);

  const handleSave = async () => {
    if (!validate(form)) return;
    const clearPersonFilters = form.personFilters.filter(
      (f) => f.roleId !== null && f.personIds.length > 0
    );
    const requestData = {
      title: form.title,
      description: form.description,
      contentTypeId: form.contentTypeId || null,
      languageId: form.languageId || null,
      countryId: form.countryId || null,
      yearFrom: form.yearFrom ? parseInt(form.yearFrom) : null,
      yearTo: form.yearTo ? parseInt(form.yearTo) : null,
      themeIds: selectedThemes.map((t) => t.id),
      personFilters: clearPersonFilters,
    };

    try {
      if (isNew) {
        const newId = await createMutation.mutateAsync(requestData as any);
        setMode('view');
        setForm(emptyForm());
        navigate(`/contents/${newId}`);
      } else {
        await patchMutation.mutateAsync({ id: id!, ...requestData } as any);
        setMode('view');
      }
    } catch (err: any) {
      setGlobalError(err.response?.data?.message || 'Ошибка при сохранении');
    }
  };

  const handleCancel = () => {
    if (isNew) {
      navigate('/contents');
    } else {
      if (content) {
        setForm({
          title: content.title ?? '',
          description: content.description ?? '',
          contentTypeId: content.contentTypeId ?? 0,
          languageId: content.languageId ?? 0,
          countryId: content.countryId ?? 0,
          yearFrom: content.yearFrom != null ? String(content.yearFrom) : '',
          yearTo: content.yearTo != null ? String(content.yearTo) : '',
          personFilters: (content.participants ?? []).map((group: any) => ({
            roleId: group.role,
            personIds: (group.persons ?? []).map((p: any) => p.id),
          })),
        });
        setSelectedThemes(content.themes ?? []);
      }
      setMode('view');
    }
  };

  const isSaving = createMutation.isPending || patchMutation.isPending;
  const isEditing = mode === 'edit';
  const isValid = Object.keys(errors).length === 0;

  const langName =
    languages.find((l: any) => l.id === form.languageId)?.name ?? '';
  const countryName =
    countries.find((c: any) => c.id === form.countryId)?.name ?? '';
  const typeName =
    contentTypes.find((t: any) => t.id === form.contentTypeId)?.name ?? '';

  if (isLoading) return <div className={styles['loading']}>Загрузка...</div>;
  if (error || (!content && !isNew))
    return <div className={styles['error']}>Контент не найден</div>;

  return (
    <div className={styles['book-unit']}>
      <div className={styles['book-unit-header']}>
        <button onClick={() => navigate(-1)}>
          <ArrowLeft style={{ cursor: 'pointer' }} /> Назад
        </button>
        <h2>{isNew ? 'Новый контент' : content?.title}</h2>
        <ErrorMsg text={globalError} />

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
          <h3>Основная информация</h3>

          {isEditing ? (
            <div className={styles['edit-form']}>
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Название</label>
                <input
                  className={styles['field-input']}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Название контента"
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
                  placeholder="Описание контента"
                />
                <ErrorMsg text={errors.description} />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Вид документа</label>
                <select
                  className={styles['field-input']}
                  value={form.contentTypeId}
                  onChange={(e) => set('contentTypeId', Number(e.target.value))}
                >
                  <option value={0}>Выберите тип...</option>
                  {contentTypes.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <ErrorMsg text={errors.contentTypeId} />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Год от</label>
                <input
                  className={styles['field-input']}
                  type="number"
                  value={form.yearFrom}
                  onChange={(e) => set('yearFrom', e.target.value)}
                  placeholder="Год от"
                />
                <ErrorMsg text={errors.yearFrom} />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Год до</label>
                <input
                  className={styles['field-input']}
                  type="number"
                  value={form.yearTo}
                  onChange={(e) => set('yearTo', e.target.value)}
                  placeholder="Год до"
                />
                <ErrorMsg text={errors.yearTo} />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Язык</label>
                <select
                  className={styles['field-input']}
                  value={form.languageId}
                  onChange={(e) => set('languageId', Number(e.target.value))}
                >
                  <option value={0}>Выберите язык...</option>
                  {languages.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <ErrorMsg text={errors.language} />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Страна</label>
                <select
                  className={styles['field-input']}
                  value={form.countryId}
                  onChange={(e) => set('countryId', Number(e.target.value))}
                >
                  <option value={0}>Выберите страну...</option>
                  {countries.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ErrorMsg text={errors.country} />
              </div>

              <PersonFilter
                value={form.personFilters}
                roles={roles}
                itemType="content"
                onChange={(pf) => set('personFilters', pf)}
                initialPersons={initialPersons}
              />
              <ErrorMsg text={errors.personFilters} />

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Темы</label>
                <ThemeSelector
                  selectedThemes={selectedThemes}
                  onAdd={(t) => setSelectedThemes([...selectedThemes, t])}
                  onRemove={(tid) =>
                    setSelectedThemes(
                      selectedThemes.filter((t) => t.id !== tid)
                    )
                  }
                />
              </div>
            </div>
          ) : (
            <div className={styles['edit-form']}>
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Название</label>
                <input
                  className={styles['field-input']}
                  value={form.title}
                  readOnly
                  placeholder="Название контента"
                />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Описание</label>
                <textarea
                  className={styles['field-textarea']}
                  value={form.description}
                  readOnly
                  rows={4}
                  placeholder="Описание контента"
                />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Вид документа</label>
                <input
                  className={styles['field-input']}
                  value={typeName}
                  readOnly
                  placeholder="Вид документа"
                />
              </div>
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Год от</label>
                <input
                  className={styles['field-input']}
                  value={form.yearFrom}
                  readOnly
                  placeholder="Год"
                />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Год до</label>
                <input
                  className={styles['field-input']}
                  value={form.yearTo}
                  readOnly
                  placeholder="Год"
                />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Язык</label>
                <input
                  className={styles['field-input']}
                  value={langName}
                  readOnly
                  placeholder="Язык"
                />
              </div>

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Страна</label>
                <input
                  className={styles['field-input']}
                  value={countryName}
                  readOnly
                  placeholder="Страна"
                />
              </div>

              <PersonFilter
                value={form.personFilters}
                roles={roles}
                itemType="content"
                onChange={() => {}}
                initialPersons={initialPersons}
                readOnly
              />

              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Темы</label>
                <div
                  className={styles['field-input']}
                  style={{
                    minHeight: 36,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    alignItems: 'center',
                  }}
                >
                  {selectedThemes.length > 0 ? (
                    selectedThemes.map((t) => (
                      <GenreChip
                        key={t.id}
                        genreName={t.name}
                        onClick={() => {}}
                      />
                    ))
                  ) : (
                    <span style={{ color: '#999' }}>—</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isNew && id && <ContentTagsManagement contentId={id} />}
      {!isNew && id && (
        <div className={styles['contents-section']}>
          <h3>Входит в состав книг</h3>
          {isLoadingAssociatedBooks ? (
            <div className={styles['loading']}>Загрузка списка книг...</div>
          ) : associatedBooks.length > 0 ? (
            <div
              className={styles['books-list']}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              {associatedBooks.map((book) => (
                <div
                  key={book.id}
                  className={styles['book-item']}
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  {book.coverPath && (
                    <img
                      src={storageUrl(book.coverPath) ?? ''}
                      alt={book.title}
                      style={{
                        width: '40px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: '500' }}>{book.title}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {book.year ? `${book.year} г.` : 'Год не указан'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#999', marginTop: '10px' }}>
              Этот контент пока не привязан ни к одной книге.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
