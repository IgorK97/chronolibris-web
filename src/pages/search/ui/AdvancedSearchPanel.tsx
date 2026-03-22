import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useLanguages,
  useCountries,
  usePersonRoles,
  usePersonSuggestions,
  useTagSuggestions,
  type PersonSuggestionDto,
  type TagSuggestionDto,
  type PersonRoleDto,
} from '@api/searchReference';
import type { PersonRoleFilterRequest } from '@/api/search';
import styles from './AdvancedSearchPanel.module.css';
import type { AdvancedFilters } from '../utils/filterParams';
import { EMPTY_FILTERS } from '../utils/filterParams';
interface Props {
  filters: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  onClose: () => void;
}

interface SelectedPerson {
  id: number;
  name: string;
  roleId: number | null;
}

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
    <div className={styles['filter-section']}>
      <label className={styles['filter-label']}>Персоналии</label>
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
          className={styles['filter-input']}
          placeholder="Введите имя..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropDown(true);
          }}
          onFocus={() => input.length >= 2 && setShowDropDown(true)}
        />
        {showDropDown && suggestions.length > 0 && (
          <ul className={styles['dropdown']}>
            {suggestions.map((s) => (
              <li
                key={s.id}
                className={styles['dropdown-item']}
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

interface SelectedTag {
  id: number;
  name: string;
  matchedName: string | null;
  mode: 'include' | 'exclude';
}

function TagFilter({
  requiredTagIds,
  excludedTagIds,
  onChange,
}: {
  requiredTagIds: number[];
  excludedTagIds: number[];
  onChange: (required: number[], excluded: number[]) => void;
}) {
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<SelectedTag[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  const { data: suggestions = [] } = useTagSuggestions(debouncedInput);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const emitChange = (next: SelectedTag[]) => {
    setSelected(next);
    onChange(
      next.filter((t) => t.mode === 'include').map((t) => t.id),
      next.filter((t) => t.mode === 'exclude').map((t) => t.id)
    );
  };

  const handleSelect = (tag: TagSuggestionDto) => {
    if (selected.some((t) => t.id === tag.id)) {
      setInput('');
      setShowDropdown(false);
      return;
    }
    emitChange([
      ...selected,
      {
        id: tag.id,
        name: tag.name,
        matchedName: tag.matchedName,
        mode: 'include',
      },
    ]);
    setInput('');
    setShowDropdown(false);
  };

  const toggleMode = (tagId: number) => {
    emitChange(
      selected.map((t) =>
        t.id === tagId
          ? { ...t, mode: t.mode === 'include' ? 'exclude' : 'include' }
          : t
      )
    );
  };

  const handleRemove = (tagId: number) => {
    emitChange(selected.filter((t) => t.id !== tagId));
  };

  return (
    <div className={styles['filter-section']}>
      <label className={styles['filter-label']}>Теги</label>

      {selected.length > 0 && (
        <div className={styles['tag-list']}>
          {selected.map((t) => (
            <div
              key={t.id}
              className={`${styles['tag-chip']} ${
                t.mode === 'exclude'
                  ? styles['tag-chip-exclude']
                  : styles['tag-chip-include']
              }`}
            >
              <button
                className={styles['tag-mode-btn']}
                onClick={() => toggleMode(t.id)}
                title={
                  t.mode === 'include'
                    ? 'Нажмите чтобы исключить'
                    : 'Нажмите чтобы включить'
                }
              >
                {t.mode === 'include' ? '+' : '−'}
              </button>
              <span className={styles['tag-chip-name']}>
                {t.name}
                {t.matchedName && t.matchedName !== t.name && (
                  <span className={styles['tag-synonym-hint']}>
                    {' '}
                    («{t.matchedName}»)
                  </span>
                )}
              </span>
              <button
                className={styles['remove-btn']}
                onClick={() => handleRemove(t.id)}
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
          className={styles['filter-input']}
          placeholder="Введите название тега..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => input.length >= 2 && setShowDropdown(true)}
        />
        {showDropdown && suggestions.length > 0 && (
          <ul className={styles['dropdown']}>
            {suggestions.map((s) => (
              <li
                key={s.id}
                className={styles['dropdown-item']}
                onMouseDown={() => handleSelect(s)}
              >
                <span>{s.name}</span>
                {s.matchedName && (
                  <span className={styles['synonym-hint']}>
                    через «{s.matchedName}»
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className={styles['filter-hint']}>
        Нажмите «+» / «−» на теге чтобы переключить режим включения/исключения
      </p>
    </div>
  );
}
function CheckboxList({
  items,
  selected,
  onToggle,
  label,
}: {
  items: { id: number; name: string }[];
  selected: number[];
  onToggle: (id: number) => void;
  label: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles['filter-section']}>
      <label className={styles['filter-label']}>{label}</label>
      <input
        className={styles['filter-input']}
        placeholder={`Фильтр по ${label.toLowerCase()}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className={styles['checkbox-list']}>
        {filtered.map((item) => (
          <label key={item.id} className={styles['checkbox-item']}>
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => onToggle(item.id)}
            />
            <span>{item.name}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <span className={styles['empty-hint']}>Ничего не найдено</span>
        )}
      </div>
      {selected.length > 0 && (
        <p className={styles['filter-hint']}>Выбрано: {selected.length}</p>
      )}
    </div>
  );
}

// ─── Подкомпонент: период лет ─────────────────────────────────────────────────

function YearRangeFilter({
  yearFrom,
  yearTo,
  onChange,
}: {
  yearFrom: number | null;
  yearTo: number | null;
  onChange: (from: number | null, to: number | null) => void;
}) {
  const currentYear = new Date().getFullYear();

  const handleFrom = (raw: string) => {
    const v = raw === '' ? null : parseInt(raw, 10);
    if (v !== null && (v < 0 || v > currentYear + 10)) return;
    onChange(v, yearTo);
  };

  const handleTo = (raw: string) => {
    const v = raw === '' ? null : parseInt(raw, 10);
    if (v !== null && (v < 0 || v > currentYear + 10)) return;
    onChange(yearFrom, v);
  };

  const isInvalid = yearFrom !== null && yearTo !== null && yearFrom > yearTo;

  return (
    <div className={styles['filter-section']}>
      <label className={styles['filter-label']}>Год издания</label>
      <div className={styles['year-range']}>
        <input
          type="number"
          className={`${styles['year-input']} ${isInvalid ? styles['year-input-error'] : ''}`}
          placeholder="с"
          value={yearFrom ?? ''}
          min={0}
          max={currentYear + 10}
          onChange={(e) => handleFrom(e.target.value)}
        />
        <span className={styles['year-dash']}>—</span>
        <input
          type="number"
          className={`${styles['year-input']} ${isInvalid ? styles['year-input-error'] : ''}`}
          placeholder="по"
          value={yearTo ?? ''}
          min={0}
          max={currentYear + 10}
          onChange={(e) => handleTo(e.target.value)}
        />
      </div>
      {isInvalid && (
        <p className={styles['error-hint']}>«С» не может быть больше «по»</p>
      )}
    </div>
  );
}

// ─── AdvancedSearchPanel ──────────────────────────────────────────────────────

export function AdvancedSearchPanel({ filters, onChange, onClose }: Props) {
  const { data: languages = [] } = useLanguages();
  const { data: countries = [] } = useCountries();
  const { data: roles = [] } = usePersonRoles();

  const toggle = <K extends keyof AdvancedFilters>(key: K, id: number) => {
    const arr = filters[key] as number[];
    onChange({
      ...filters,
      [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
    });
  };

  const resetAll = () => onChange(EMPTY_FILTERS);

  const hasAnyFilter =
    filters.personFilters.length > 0 ||
    filters.requiredTagIds.length > 0 ||
    filters.excludedTagIds.length > 0 ||
    filters.languageIds.length > 0 ||
    filters.countryIds.length > 0 ||
    filters.yearFrom !== null ||
    filters.yearTo !== null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Расширенный поиск</span>
        <div className={styles['header-actions']}>
          {hasAnyFilter && (
            <button className={styles['reset-btn']} onClick={resetAll}>
              Сбросить всё
            </button>
          )}
          <button className={styles['close-btn']} onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {/* Персоналии */}
        <PersonFilter
          value={filters.personFilters}
          roles={roles}
          onChange={(pf) => onChange({ ...filters, personFilters: pf })}
        />

        {/* Теги */}
        <TagFilter
          requiredTagIds={filters.requiredTagIds}
          excludedTagIds={filters.excludedTagIds}
          onChange={(req, exc) =>
            onChange({ ...filters, requiredTagIds: req, excludedTagIds: exc })
          }
        />

        {/* Год */}
        <YearRangeFilter
          yearFrom={filters.yearFrom}
          yearTo={filters.yearTo}
          onChange={(from, to) =>
            onChange({ ...filters, yearFrom: from, yearTo: to })
          }
        />

        {/* Языки */}
        <CheckboxList
          label="Языки"
          items={languages}
          selected={filters.languageIds}
          onToggle={(id) => toggle('languageIds', id)}
        />

        {/* Страны */}
        <CheckboxList
          label="Страны"
          items={countries}
          selected={filters.countryIds}
          onToggle={(id) => toggle('countryIds', id)}
        />
      </div>
    </div>
  );
}
