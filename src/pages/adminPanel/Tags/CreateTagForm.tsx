// components/Tags/CreateTagForm.tsx
import React, { useState } from 'react';
import { useCreateTag, TAG_TYPES } from '@/api/tags';
import styles from './CreateTagForm.module.css';

interface CreateTagFormProps {
  onSuccess?: () => void;
}

export const CreateTagForm: React.FC<CreateTagFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [tagTypeId, setTagTypeId] = useState<number>(1);
  const createMutation = useCreateTag();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate(
      { name: name.trim(), tagTypeId },
      {
        onSuccess: () => {
          setName('');
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className={styles['container']}>
      <h3 className={styles['title']}>Добавить тег</h3>

      <div className={styles['form-group']}>
        <label className={styles['label']}>Название тега:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles['input']}
          placeholder="Введите название тега"
          required
        />
      </div>

      <div className={styles['form-group']}>
        <label className={styles['label']}>Тип тега:</label>
        <select
          value={tagTypeId}
          onChange={(e) => setTagTypeId(Number(e.target.value))}
          className={styles['select']}
        >
          {TAG_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className={styles['submit-button']}
        disabled={createMutation.isPending || !name.trim()}
      >
        {createMutation.isPending ? 'Создание...' : 'Создать'}
      </button>

      {createMutation.isError && (
        <div className={styles['error']}>Ошибка при создании тега</div>
      )}
    </form>
  );
};
