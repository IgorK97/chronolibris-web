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
import type { AdvancedFilters } from '../../../utils/filterParams';
// import { EMPTY_FILTERS } from '../utils/filterParams';
import { X } from 'lucide-react';
import { useStore } from '@/stores/globalStore';
interface Props {
  filters: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  onClose: () => void;
  mode?: boolean;
  onModeChange?: (mode: boolean) => void;
}

interface SelectedPerson {
  id: number;
  uid: string;
  name: string;
  roleId: number | null;
}

function buildSelectedPersons(
  personFilters: PersonRoleFilterRequest[],
  cache: Record<number, { id: number; name: string }>
): SelectedPerson[] {
  return personFilters.flatMap((pf) =>
    pf.personIds.map((id) => ({
      id,
      name: cache[id]?.name ?? `#${id}`,
      roleId: pf.roleId,
      uid: `${id}-${pf.roleId}`,
    }))
  );
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
  const { filterNamesCache, cachePersons } = useStore();
  const [input, setInput] = useState('');

  const [showDropDown, setShowDropDown] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  const { data: suggestions = [] } = usePersonSuggestions(debouncedInput);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected: SelectedPerson[] = buildSelectedPersons(
    value,
    filterNamesCache.persons
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node))
        setShowDropDown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (suggestions.length > 0) {
      cachePersons(suggestions.map((s) => ({ id: s.id, name: s.name })));
    }
  }, [suggestions, cachePersons]);

  const changePersons = (next: SelectedPerson[]) => {
    // setSelected(next);
    const grouped = new Map<number | null, number[]>();
    for (const p of next) {
      // if (p.roleId == null) continue;
      const rId = p.roleId;
      if (!grouped.has(rId)) grouped.set(rId, []);
      grouped.get(rId)!.push(p.id);
    }
    onChange(
      [...grouped]
        // .filter(([roleId]) => roleId !== null)
        .map(([roleId, personIds]) => ({
          roleId: roleId as number,
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
    if (!selected.some((p) => p.id === person.id)) {
      cachePersons([{ id: person.id, name: person.name }]);
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

  return (
    <div className={styles['filter-section']}>
      <label className={styles['filter-label']}>Персоналии</label>
      {selected.length > 0 && (
        <div className={styles['person-list']}>
          {selected.map((p) => (
            <div key={p.uid} className={styles['person-row']}>
              <span className={styles['person-name']}>{p.name}</span>
              <select
                className={styles['role-select']}
                value={p.roleId ?? ''}
                onChange={(e) =>
                  handleRoleChange(p.uid, p.id, Number(e.target.value))
                }
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
                onClick={() => handleRemove(p.uid)}
                title="Удалить"
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

function buildSelectedTags(
  requiredTagIds: number[],
  excludedTagIds: number[],
  cache: Record<
    number,
    { id: number; name: string; matchedName: string | null }
  >
): SelectedTag[] {
  const req: SelectedTag[] = requiredTagIds.map((id) => ({
    id,
    name: cache[id]?.name ?? `#${id}`,
    matchedName: cache[id]?.matchedName ?? null,
    mode: 'include' as const,
  }));
  const exc: SelectedTag[] = excludedTagIds.map((id) => ({
    id,
    name: cache[id]?.name ?? `#${id}`,
    matchedName: cache[id]?.matchedName ?? null,
    mode: 'exclude' as const,
  }));
  return [...req, ...exc];
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
  const { filterNamesCache, cacheTags } = useStore();
  const [input, setInput] = useState('');
  // const [selected, setSelected] = useState<SelectedTag[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedInput = useDebounce(input, 300);
  const { data: suggestions = [] } = useTagSuggestions(debouncedInput);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected: SelectedTag[] = buildSelectedTags(
    requiredTagIds,
    excludedTagIds,
    filterNamesCache.tags
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (suggestions.length > 0) {
      cacheTags(
        suggestions.map((s) => ({
          id: s.id,
          name: s.name,
          matchedName: s.matchedName,
        }))
      );
    }
  }, [suggestions, cacheTags]);

  const changeTags = (next: SelectedTag[]) => {
    // setSelected(next);
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

    cacheTags([{ id: tag.id, name: tag.name, matchedName: tag.matchedName }]);

    changeTags([
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
    changeTags(
      selected.map((t) =>
        t.id === tagId
          ? { ...t, mode: t.mode === 'include' ? 'exclude' : 'include' }
          : t
      )
    );
  };

  const handleRemove = (tagId: number) => {
    changeTags(selected.filter((t) => t.id !== tagId));
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
                title="Удалить"
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
  // console.log('SELECTION', filters.selectionId);
  // console.log('THEME', filters.themeId);
  const handleApply = () => {
    const resDraft: AdvancedFilters = {
      personFilters: draft.personFilters.filter((pf) => pf.roleId),
      excludedTagIds: draft.excludedTagIds,
      requiredTagIds: draft.requiredTagIds,
      themeId: filters.themeId,
      selectionId: filters.selectionId,
    };
    onChange(resDraft);
  };

  const isDirty = JSON.stringify(draft) !== JSON.stringify(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Расширенный поиск</span>
        <div className={styles['header-actions']}>
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
        <PersonFilter
          // value={filters.personFilters}
          value={draft.personFilters}
          roles={roles}
          onChange={(pf) => setDraft({ ...draft, personFilters: pf })}
        />

        <TagFilter
          // requiredTagIds={filters.requiredTagIds}
          // excludedTagIds={filters.excludedTagIds}
          requiredTagIds={draft.requiredTagIds}
          excludedTagIds={draft.excludedTagIds}
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
