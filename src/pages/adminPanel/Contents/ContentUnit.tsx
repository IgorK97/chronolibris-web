/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/ContentUnit.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useContentById,
  useCreateContent,
  usePatchContent,
  useContentBooks,
} from '@/api/contents';
import {
  useLanguages,
  useCountries,
  // useFormats
} from '@/api/references';
import {
  usePersonRoles,
  usePersonSuggestions,
  type PersonSuggestionDto,
  type PersonRoleDto,
} from '@api/searchReference';
import type { PersonRoleFilterRequest } from '@/api/search';
import { useDebounce } from '@/hooks/useDebounce';
import { ThemeSelector } from '../Themes/ThemeSelector';
import { ContentTagsManager } from './ContentTagsManagement';
import type { ThemeDto } from '@/types/types';
import styles from './ContentUnit.module.css';
import { ArrowLeft, X } from 'lucide-react';
import { storageUrl } from '@/utils';

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
  { id: 13, name: 'Богословский трактат', nature: 'Work' },
  { id: 14, name: 'Политический трактат', nature: 'Work' },
  { id: 15, name: 'Биография', nature: 'Work' },
  { id: 16, name: 'Путевые заметки', nature: 'Work' },
  { id: 17, name: 'Сборник', nature: 'Work' },
  { id: 18, name: 'Учебник', nature: 'Work' },
  { id: 19, name: 'Историческое исследование', nature: 'Analysis' },
  { id: 20, name: 'Монография', nature: 'Analysis' },
  { id: 21, name: 'Научная статья', nature: 'Analysis' },
  { id: 22, name: 'Неизвестно', nature: 'Unknown' },
];

interface SelectedPerson {
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
  year: string;
  personFilters: PersonRoleFilterRequest[];
}

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  contentTypeId: 0,
  languageId: 0,
  countryId: 0,
  year: '',
  personFilters: [],
});

// ---------------------------------------------------------------------------
// PersonFilter (identical to BookUnit's version)
// ---------------------------------------------------------------------------

function PersonFilter({
  value,
  roles,
  onChange,
  initialPersons,
  readOnly = false,
}: {
  value: PersonRoleFilterRequest[];
  roles: PersonRoleDto[];
  onChange: (v: PersonRoleFilterRequest[]) => void;
  initialPersons?: SelectedPerson[];
  readOnly?: boolean;
}) {
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<SelectedPerson[]>(() => {
    if (initialPersons && initialPersons.length > 0) return initialPersons;
    return value.flatMap((pf) =>
      (pf.personIds ?? []).map((id) => ({
        id,
        name: `#${id}`,
        roleId: pf.roleId,
      }))
    );
  });
  const [showDropDown, setShowDropDown] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  const { data: suggestions = [] } = usePersonSuggestions(debouncedInput);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPersons && initialPersons.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(initialPersons);
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
                {roles.map((r) => (
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const ContentForm: React.FC = () => {
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

  const createMutation = useCreateContent();
  const patchMutation = usePatchContent();

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedThemes, setSelectedThemes] = useState<ThemeDto[]>([]);
  const [initialPersons, setInitialPersons] = useState<SelectedPerson[]>([]);

  // New content → start in edit mode
  useEffect(() => {
    if (isNew) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('edit');
      setForm(emptyForm());
    }
  }, [isNew]);

  // Populate form when content loads
  useEffect(() => {
    if (content) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: content.title ?? '',
        description: content.description ?? '',
        contentTypeId: content.contentTypeId ?? 0,
        languageId: content.languageId ?? 0,
        countryId: content.countryId ?? 0,
        year: content.year != null ? String(content.year) : '',
        personFilters: (content.participants ?? []).map((group: any) => ({
          roleId: group.role,
          personIds: (group.persons ?? []).map((p: any) => p.id),
        })),
      });
      setSelectedThemes(content.themes ?? []);

      const persons: SelectedPerson[] = (content.participants ?? []).flatMap(
        (group: any) =>
          (group.persons ?? []).map((p: any) => ({
            id: p.id,
            name: p.fullName,
            roleId: group.role,
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

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('Название обязательно');
      return;
    }

    const requestData = {
      title: form.title,
      description: form.description,
      contentTypeId: form.contentTypeId || null,
      languageId: form.languageId || null,
      countryId: form.countryId || null,
      year: form.year ? parseInt(form.year) : null,
      themeIds: selectedThemes.map((t) => t.id),
      personFilters: form.personFilters,
    };

    try {
      if (isNew) {
        const newId = await createMutation.mutateAsync(requestData as any);
        navigate(`/contents/${newId}`);
      } else {
        await patchMutation.mutateAsync({ id: id!, ...requestData } as any);
        setMode('view');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при сохранении');
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
          year: content.year != null ? String(content.year) : '',
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

  // Lookup helpers
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
      {/* ── Header ── */}
      <div className={styles['book-unit-header']}>
        <button
          onClick={() => navigate('/contents')}
          className={styles['btn btn-secondary']}
        >
          <ArrowLeft /> Назад к списку
        </button>
        <h2>{isNew ? 'Новый контент' : content?.title}</h2>
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

      {/* ── Metadata ── */}
      <div className={styles['book-metadata']}>
        <div className={styles['metadata-section']}>
          <h3>Основная информация</h3>

          {isEditing ? (
            /* ── EDIT FORM ── */
            <div className={styles['edit-form']}>
              {/* Название */}
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Название *</label>
                <input
                  className={styles['field-input']}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Название контента"
                />
              </div>

              {/* Описание */}
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Описание</label>
                <textarea
                  className={styles['field-textarea']}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={4}
                  placeholder="Описание контента"
                />
              </div>

              {/* Вид документа */}
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
              </div>

              {/* Год */}
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

              {/* Язык */}
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
              </div>

              {/* Страна */}
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
              </div>

              {/* Персоналии */}
              <PersonFilter
                value={form.personFilters}
                roles={roles}
                onChange={(pf) => set('personFilters', pf)}
                initialPersons={initialPersons}
              />

              {/* Темы */}
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
            /* ── VIEW MODE ── */
            <div className={styles['edit-form']}>
              {/* Название */}
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Название *</label>
                <input
                  className={styles['field-input']}
                  value={form.title}
                  readOnly
                  placeholder="Название контента"
                />
              </div>

              {/* Описание */}
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

              {/* Вид документа */}
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Вид документа</label>
                <input
                  className={styles['field-input']}
                  value={typeName}
                  readOnly
                  placeholder="Вид документа"
                />
              </div>

              {/* Год */}
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Год</label>
                <input
                  className={styles['field-input']}
                  value={form.year}
                  readOnly
                  placeholder="Год"
                />
              </div>

              {/* Язык */}
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Язык</label>
                <input
                  className={styles['field-input']}
                  value={langName}
                  readOnly
                  placeholder="Язык"
                />
              </div>

              {/* Страна */}
              <div className={styles['field-group']}>
                <label className={styles['field-label']}>Страна</label>
                <input
                  className={styles['field-input']}
                  value={countryName}
                  readOnly
                  placeholder="Страна"
                />
              </div>

              {/* Персоналии – только просмотр */}
              <PersonFilter
                value={form.personFilters}
                roles={roles}
                onChange={() => {}}
                initialPersons={initialPersons}
                readOnly
              />

              {/* Темы – только просмотр */}
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
                      <span
                        key={t.id}
                        style={{
                          background: 'var(--color-bg-secondary, #f0f0f0)',
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontSize: 13,
                        }}
                      >
                        {t.name}
                      </span>
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

      {/* ── Tags – only for existing content ── */}
      {!isNew && id && (
        <div className={styles['contents-section']}>
          <h3>Управление тегами</h3>
          <ContentTagsManager contentId={id} />
        </div>
      )}
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
                  style={{
                    padding: '12px',
                    border: '1px solid var(--color-border, #ddd)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => navigate(`/books/${book.id}`)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      'var(--color-bg-secondary, #f9f9f9)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
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
