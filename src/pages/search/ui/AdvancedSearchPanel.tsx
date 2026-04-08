import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  usePersonRoles,
  usePersonSuggestions,
  useTagSuggestions,
} from '@api/searchReference';
import type {
  PersonRoleDto,
  PersonRoleFilterRequest,
  PersonSuggestionDto,
  TagSuggestionDto,
} from '@/types';
import styles from './AdvancedSearchPanel.module.css';
import type { AdvancedFilters } from '../utils/filterParams';
// import { EMPTY_FILTERS } from '../utils/filterParams';
import { X } from 'lucide-react';
interface Props {
  filters: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  onClose: () => void;
  mode?: boolean;
  onModeChange?: (mode: boolean) => void;
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

  useEffect(() => {
    if (value.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected([]);
    }
  }, [value]);

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
                <X style={{ cursor: 'pointer' }} />
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

  useEffect(() => {
    if (requiredTagIds.length === 0 && excludedTagIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected([]);
    }
  }, [requiredTagIds, excludedTagIds]);

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
                <X style={{ cursor: 'pointer' }} />
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

export function AdvancedSearchPanel({
  filters,
  onChange,
  onClose,
  mode,
  onModeChange,
}: Props) {
  const { data: roles = [] } = usePersonRoles();
  const [draft, setDraft] = useState<AdvancedFilters>(filters);
  // const resetAll = () => onChange(EMPTY_FILTERS);
  const handleApply = () => {
    onChange(draft);
  };
  // const hasAnyFilter =
  //   filters.personFilters.length > 0 ||
  //   filters.requiredTagIds.length > 0 ||
  //   filters.excludedTagIds.length > 0;

  const isDirty = JSON.stringify(draft) !== JSON.stringify(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Расширенный поиск</span>
        <div className={styles['header-actions']}>
          {/* {hasAnyFilter && (
            <button className={styles['reset-btn']} onClick={resetAll}>
              Сбросить всё
            </button>
          )} */}
          <button className={styles['close-btn']} onClick={onClose}>
            <X style={{ cursor: 'pointer' }} />
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {onModeChange && (
          <div className={styles['filter-section']}>
            <label className={styles['filter-label']}>Режим отображения</label>
            <div className={styles['mode-toggle']}>
              <button
                className={`${styles['mode-btn']} ${!mode ? styles['mode-btn-active'] : ''}`}
                onClick={() => onModeChange(false)}
              >
                Только активные
              </button>
              <button
                className={`${styles['mode-btn']} ${mode ? styles['mode-btn-active'] : ''}`}
                onClick={() => onModeChange(true)}
              >
                Все (включая скрытые)
              </button>
            </div>
          </div>
        )}
        {/* Персоналии */}
        <PersonFilter
          value={filters.personFilters}
          roles={roles}
          onChange={(pf) => setDraft({ ...draft, personFilters: pf })}
        />

        {/* Теги */}
        <TagFilter
          requiredTagIds={filters.requiredTagIds}
          excludedTagIds={filters.excludedTagIds}
          onChange={(req, exc) =>
            setDraft({ ...draft, requiredTagIds: req, excludedTagIds: exc })
          }
        />
        <div className={styles.footer}>
          <button
            className={styles['reset-btn']}
            onClick={handleApply}
            disabled={!isDirty}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
