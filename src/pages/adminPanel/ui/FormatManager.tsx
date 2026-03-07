/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/FormatManager.tsx
import React, { useState } from 'react';
import {
  useFormats,
  useCreateFormat,
  useUpdateFormat,
  useDeleteFormat,
} from '@/api/references';
import type {
  CreateFormatRequest,
  FormatDto,
  UpdateFormatRequest,
} from '@/types/types';
import styles from './FormatManager.module.css';

export const FormatManager: React.FC = () => {
  const { data: formats, isLoading, error } = useFormats();
  const createMutation = useCreateFormat();
  const updateMutation = useUpdateFormat();
  const deleteMutation = useDeleteFormat();

  const [formData, setFormData] = useState<CreateFormatRequest>({
    name: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateFormatRequest | null>(
    null
  );

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Название формата обязательно');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setFormData({ name: '' });
    } catch (err: any) {
      console.error('Ошибка создания формата:', err);
      alert(err.response?.data?.message || 'Ошибка создания формата');
    }
  };

  const handleUpdate = async (id: number, name: string) => {
    if (!name.trim()) {
      alert('Название формата обязательно');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        data: { id, name } as UpdateFormatRequest,
      });
      setEditingId(null);
      setEditFormData(null);
    } catch (err: any) {
      console.error('Ошибка обновления формата:', err);
      alert(err.response?.data?.message || 'Ошибка обновления формата');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот формат?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        console.error('Ошибка удаления формата:', err);
        alert(err.response?.data?.message || 'Ошибка удаления формата');
      }
    }
  };

  const startEditing = (format: FormatDto) => {
    setEditingId(format.id);
    setEditFormData({ id: format.id, name: format.name });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  if (isLoading) {
    return (
      <div className={styles['format-manager']}>
        <div className={styles['loading']}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['format-manager']}>
        <div className={styles['error']}>
          Ошибка: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className={styles['format-manager']}>
      <h2>Управление форматами книг</h2>

      {/* Форма создания */}
      <div className={styles['form-section']}>
        <h3>Добавить новый формат</h3>
        <div className={styles['form-group']}>
          <input
            type="text"
            placeholder="Название формата (например: Твердый переплет)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={styles['input-field']}
            maxLength={50}
          />
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending || !formData.name.trim()}
            className={styles['btn btn-primary']}
          >
            {createMutation.isPending ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>

      {/* Список форматов */}
      <div className={styles['list-section']}>
        <h3>Список форматов ({formats?.length || 0})</h3>
        <table className={styles['formats-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {formats?.map((format) => (
              <tr key={format.id}>
                {editingId === format.id ? (
                  <>
                    <td>{format.id}</td>
                    <td>
                      <input
                        type="text"
                        value={editFormData?.name || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData!,
                            name: e.target.value,
                          })
                        }
                        className={styles['input-field']}
                        maxLength={50}
                        autoFocus
                      />
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          handleUpdate(format.id, editFormData?.name || '')
                        }
                        className={styles['btn btn-success']}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending
                          ? 'Сохранение...'
                          : 'Сохранить'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className={styles['btn btn-secondary']}
                        disabled={updateMutation.isPending}
                      >
                        Отмена
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{format.id}</td>
                    <td>{format.name}</td>
                    <td>
                      <button
                        onClick={() => startEditing(format)}
                        className={styles['btn btn-warning']}
                        disabled={
                          deleteMutation.isPending || updateMutation.isPending
                        }
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(format.id)}
                        className={styles['btn btn-danger']}
                        disabled={
                          deleteMutation.isPending || updateMutation.isPending
                        }
                      >
                        {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
