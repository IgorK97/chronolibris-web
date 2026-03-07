/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/CountryManager.tsx
import React, { useState } from 'react';
import {
  useCountries,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
} from '@/api/references';
import type {
  CountryDto,
  CreateCountryRequest,
  UpdateCountryRequest,
} from '@/types/types';
import styles from './CountryManager.module.css';

export const CountryManager: React.FC = () => {
  const { data: countries, isLoading, error } = useCountries();
  const createMutation = useCreateCountry();
  const updateMutation = useUpdateCountry();
  const deleteMutation = useDeleteCountry();

  const [formData, setFormData] = useState<CreateCountryRequest>({
    name: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateCountryRequest | null>(
    null
  );

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Название страны обязательно');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setFormData({ name: '' });
    } catch (err: any) {
      console.error('Ошибка создания страны:', err);
      alert(err.response?.data?.message || 'Ошибка создания страны');
    }
  };

  const handleUpdate = async (id: number, name: string) => {
    if (!name.trim()) {
      alert('Название страны обязательно');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        data: { id, name } as UpdateCountryRequest,
      });
      setEditingId(null);
      setEditFormData(null);
    } catch (err: any) {
      console.error('Ошибка обновления страны:', err);
      alert(err.response?.data?.message || 'Ошибка обновления страны');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту страну?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        console.error('Ошибка удаления страны:', err);
        alert(err.response?.data?.message || 'Ошибка удаления страны');
      }
    }
  };

  const startEditing = (country: CountryDto) => {
    setEditingId(country.id);
    setEditFormData({ id: country.id, name: country.name });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  if (isLoading) {
    return (
      <div className={styles['country-manager']}>
        <div className={styles['loading']}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="country-manager">
        <div className="error">Ошибка: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className={styles['country-manager']}>
      <h2>Управление странами</h2>

      {/* Форма создания */}
      <div className={styles['form-section']}>
        <h3>Добавить новую страну</h3>
        <div className={styles['form-group']}>
          <input
            type="text"
            placeholder="Название страны"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={styles['input-field']}
            maxLength={255}
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

      {/* Список стран */}
      <div className={styles['list-section']}>
        <h3>Список стран ({countries?.length || 0})</h3>
        <table className={styles['countries-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {countries?.map((country) => (
              <tr key={country.id}>
                {editingId === country.id ? (
                  <>
                    <td>{country.id}</td>
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
                        maxLength={255}
                        autoFocus
                      />
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          handleUpdate(country.id, editFormData?.name || '')
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
                    <td>{country.id}</td>
                    <td>{country.name}</td>
                    <td>
                      <button
                        onClick={() => startEditing(country)}
                        className={styles['btn btn-warning']}
                        disabled={
                          deleteMutation.isPending || updateMutation.isPending
                        }
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(country.id)}
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
