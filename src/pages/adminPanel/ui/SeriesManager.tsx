/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/SeriesManager.tsx
import React, { useState } from 'react';
import {
  useSeries,
  useCreateSeries,
  useUpdateSeries,
  useDeleteSeries,
} from '@/api/series';
import { usePublishers } from '@/api/publishers';
import type {
  CreateSeriesRequest,
  SeriesDto,
  UpdateSeriesRequest,
} from '@/types/types';
import styles from './SeriesManager.module.css';

export const SeriesManager: React.FC = () => {
  const { data: series, isLoading, error } = useSeries();
  const { data: publishers } = usePublishers();
  const createMutation = useCreateSeries();
  const updateMutation = useUpdateSeries();
  const deleteMutation = useDeleteSeries();

  const [formData, setFormData] = useState<CreateSeriesRequest>({
    name: '',
    publisherId: 0,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateSeriesRequest | null>(
    null
  );

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Название серии обязательно');
      return;
    }

    if (formData.publisherId <= 0) {
      alert('Выберите издательство');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setFormData({ name: '', publisherId: 0 });
    } catch (err: any) {
      console.error('Ошибка создания серии:', err);
      alert(err.response?.data?.message || 'Ошибка создания серии');
    }
  };

  const handleUpdate = async (
    id: number,
    name: string,
    publisherId: number
  ) => {
    if (!name.trim()) {
      alert('Название серии обязательно');
      return;
    }

    if (publisherId <= 0) {
      alert('Выберите издательство');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        data: { id, name, publisherId } as UpdateSeriesRequest,
      });
      setEditingId(null);
      setEditFormData(null);
    } catch (err: any) {
      console.error('Ошибка обновления серии:', err);
      alert(err.response?.data?.message || 'Ошибка обновления серии');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту серию?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        console.error('Ошибка удаления серии:', err);
        alert(err.response?.data?.message || 'Ошибка удаления серии');
      }
    }
  };

  const startEditing = (seriesItem: SeriesDto) => {
    setEditingId(seriesItem.id);
    setEditFormData({
      id: seriesItem.id,
      name: seriesItem.name,
      publisherId: seriesItem.publisherId,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className={styles['series-manager']}>
        <div className={styles['loading']}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['series-manager']}>
        <div className={styles['error']}>
          Ошибка: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className={styles['series-manager']}>
      <h2>Управление сериями книг</h2>

      {/* Форма создания */}
      <div className={styles['form-section']}>
        <h3>Добавить новую серию</h3>
        <div className={styles['form-grid']}>
          <div className={styles['form-group']}>
            <label>Название серии</label>
            <input
              type="text"
              placeholder="Название серии (например: Гарри Поттер)"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles['input-field']}
              maxLength={500}
            />
          </div>

          <div className={styles['form-group']}>
            <label>Издательство</label>
            <select
              value={formData.publisherId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  publisherId: Number(e.target.value),
                })
              }
              className={styles['input-field']}
            >
              <option value={0}>Выберите издательство</option>
              {publishers?.map((publisher) => (
                <option key={publisher.id} value={publisher.id}>
                  {publisher.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles['form-actions']}>
            <button
              onClick={handleCreate}
              disabled={
                createMutation.isPending ||
                !formData.name.trim() ||
                formData.publisherId <= 0
              }
              className={styles['btn btn-primary']}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать серию'}
            </button>
          </div>
        </div>
      </div>

      {/* Список серий */}
      <div className={styles['list-section']}>
        <h3>Список серий ({series?.length || 0})</h3>
        <table className={styles['series-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Издательство</th>
              <th>Создано</th>
              <th>Книг в серии</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {series?.map((seriesItem) => (
              <tr key={seriesItem.id}>
                {editingId === seriesItem.id ? (
                  <>
                    <td>{seriesItem.id}</td>
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
                        maxLength={500}
                      />
                    </td>
                    <td>
                      <select
                        value={editFormData?.publisherId || 0}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData!,
                            publisherId: Number(e.target.value),
                          })
                        }
                        className={styles['input-field']}
                      >
                        <option value={0}>Выберите издательство</option>
                        {publishers?.map((publisher) => (
                          <option key={publisher.id} value={publisher.id}>
                            {publisher.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{formatDate(seriesItem.createdAt)}</td>
                    <td>{seriesItem.booksCount || 0}</td>
                    <td>
                      <button
                        onClick={() =>
                          handleUpdate(
                            seriesItem.id,
                            editFormData?.name || '',
                            editFormData?.publisherId || 0
                          )
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
                    <td>{seriesItem.id}</td>
                    <td className={styles['name-cell']}>{seriesItem.name}</td>
                    <td>{seriesItem.publisherName || '—'}</td>
                    <td>{formatDate(seriesItem.createdAt)}</td>
                    <td>{seriesItem.booksCount || 0}</td>
                    <td>
                      <button
                        onClick={() => startEditing(seriesItem)}
                        className={styles['btn btn-warning']}
                        disabled={
                          deleteMutation.isPending || updateMutation.isPending
                        }
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(seriesItem.id)}
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
