import React, { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { usePersonSuggestions } from '@api/searchReference';
import { X } from 'lucide-react';
import styles from './PersonFilter.module.css';
import type { PersonRoleDto, PersonSuggestionDto } from '@/types';

export interface PersonRoleFilterRequest {
  roleId: number;
  personIds: number[];
}

interface SelectedPerson {
  id: number;
  name: string;
  roleId: number | null;
}

interface PersonFilterProps {
  value: PersonRoleFilterRequest[];
  roles: PersonRoleDto[];
  onChange: (v: PersonRoleFilterRequest[]) => void;
}

export const PersonFilter: React.FC<PersonFilterProps> = ({
  value,
  roles,
  onChange,
}) => {
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<SelectedPerson[]>([]);
  const [showDropDown, setShowDropDown] = useState(false);

  const debouncedInput = useDebounce(input, 300);
  const { data: suggestions = [] } = usePersonSuggestions(debouncedInput);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length === 0 && selected.some((p) => p.roleId !== null)) {
      //И как их избегать?
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected([]);
    }
  }, [value]);

  const handleUpdateParent = (currentSelected: SelectedPerson[]) => {
    //Группировка тех, у кого есть роль
    const grouped = new Map<number, number[]>();
    currentSelected.forEach((p) => {
      if (p.roleId !== null) {
        if (!grouped.has(p.roleId)) grouped.set(p.roleId, []);
        grouped.get(p.roleId)!.push(p.id);
      }
    });

    const result = Array.from(grouped.entries()).map(([roleId, personIds]) => ({
      roleId,
      personIds,
    }));

    onChange(result);
  };

  const handleSelect = (person: PersonSuggestionDto) => {
    if (selected.some((p) => p.id === person.id)) {
      setInput('');
      setShowDropDown(false);
      return;
    }
    const next = [
      ...selected,
      { id: person.id, name: person.name, roleId: null },
    ];
    setSelected(next);
    setInput('');
    setShowDropDown(false);
  };

  const handleRoleChange = (personId: number, roleId: number) => {
    const next = selected.map((p) =>
      p.id === personId ? { ...p, roleId } : p
    );
    setSelected(next);
    handleUpdateParent(next);
  };

  const handleRemove = (personId: number) => {
    const next = selected.filter((p) => p.id !== personId);
    setSelected(next);
    handleUpdateParent(next);
  };

  return (
    <div className={styles['filter-section']}>
      <label className={styles['filter-label']}>Персоналии</label>
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
                Выберите роль...
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleRemove(p.id)}
              className={styles['remove-btn']}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
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
                onMouseDown={() => handleSelect(s)}
                className={styles['dropdown-item']}
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
