/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/PublisherManager.tsx
import React, { useState } from 'react';
import {
  usePublishers,
  //   useCountries,
  useCreatePublisher,
  useUpdatePublisher,
  useDeletePublisher,
} from '@/api/publishers';
import { useCountries } from '@/api/references';
import type {
  CreatePublisherRequest,
  PublisherDto,
  UpdatePublisherRequest,
} from '@/types/types';
import styles from './PublisherManager.module.css';

export const PublisherManager: React.FC = () => {
  const { data: publishers, isLoading, error } = usePublishers();
  const { data: countries } = useCountries();
  const createMutation = useCreatePublisher();
  const updateMutation = useUpdatePublisher();
  const deleteMutation = useDeletePublisher();

  const [formData, setFormData] = useState<CreatePublisherRequest>({
    name: '',
    description: '',
    countryId: 0,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] =
    useState<UpdatePublisherRequest | null>(null);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Название издательства обязательно');
      return;
    }

    if (!formData.description.trim()) {
      alert('Описание издательства обязательно');
      return;
    }

    if (formData.countryId <= 0) {
      alert('Выберите страну');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setFormData({ name: '', description: '', countryId: 0 });
    } catch (err: any) {
      console.error('Ошибка создания издательства:', err);
      alert(err.response?.data?.message || 'Ошибка создания издательства');
    }
  };

  const handleUpdate = async (
    id: number,
    name: string,
    description: string,
    countryId: number
  ) => {
    if (!name.trim()) {
      alert('Название издательства обязательно');
      return;
    }

    if (!description.trim()) {
      alert('Описание издательства обязательно');
      return;
    }

    if (countryId <= 0) {
      alert('Выберите страну');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        data: { id, name, description, countryId } as UpdatePublisherRequest,
      });
      setEditingId(null);
      setEditFormData(null);
    } catch (err: any) {
      console.error('Ошибка обновления издательства:', err);
      alert(err.response?.data?.message || 'Ошибка обновления издательства');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это издательство?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        console.error('Ошибка удаления издательства:', err);
        alert(err.response?.data?.message || 'Ошибка удаления издательства');
      }
    }
  };

  const startEditing = (publisher: PublisherDto) => {
    setEditingId(publisher.id);
    setEditFormData({
      id: publisher.id,
      name: publisher.name,
      description: publisher.description,
      countryId: publisher.countryId,
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={styles['publisher-manager']}>
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['publisher-manager']}>
        <div className={styles['error']}>
          Ошибка: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className={styles['publisher-manager']}>
      <h2>Управление издательствами</h2>

      {/* Форма создания */}
      <div className={styles['form-section']}>
        <h3>Добавить новое издательство</h3>
        <div className={styles['form-grid']}>
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              placeholder="Название издательства"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles['input-field']}
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label>Страна</label>
            <select
              value={formData.countryId}
              onChange={(e) =>
                setFormData({ ...formData, countryId: Number(e.target.value) })
              }
              className={styles['input-field']}
            >
              <option value={0}>Выберите страну</option>
              {countries?.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles['form-group full-width']}>
            <label>Описание</label>
            <textarea
              placeholder="Описание издательства"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={styles['input-field textarea']}
              rows={3}
            />
          </div>

          <div className={styles['form-actions']}>
            <button
              onClick={handleCreate}
              disabled={
                createMutation.isPending ||
                !formData.name.trim() ||
                !formData.description.trim() ||
                formData.countryId <= 0
              }
              className={styles['btn btn-primary']}
            >
              {createMutation.isPending
                ? 'Создание...'
                : 'Создать издательство'}
            </button>
          </div>
        </div>
      </div>

      {/* Список издательств */}
      <div className={styles['list-section']}>
        <h3>Список издательств ({publishers?.length || 0})</h3>
        <table className={styles['publishers-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Описание</th>
              <th>Страна</th>
              <th>Создано</th>
              <th>Обновлено</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {publishers?.map((publisher) => (
              <tr key={publisher.id}>
                {editingId === publisher.id ? (
                  <>
                    <td>{publisher.id}</td>
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
                      />
                    </td>
                    <td>
                      <textarea
                        value={editFormData?.description || ''}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData!,
                            description: e.target.value,
                          })
                        }
                        className={styles['input-field textarea']}
                        rows={2}
                      />
                    </td>
                    <td>
                      <select
                        value={editFormData?.countryId || 0}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData!,
                            countryId: Number(e.target.value),
                          })
                        }
                        className={styles['input-field']}
                      >
                        <option value={0}>Выберите страну</option>
                        {countries?.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{formatDate(publisher.createdAt)}</td>
                    <td>
                      {publisher.updatedAt
                        ? formatDate(publisher.updatedAt)
                        : '—'}
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          handleUpdate(
                            publisher.id,
                            editFormData?.name || '',
                            editFormData?.description || '',
                            editFormData?.countryId || 0
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
                    <td>{publisher.id}</td>
                    <td className={styles['name-cell']}>{publisher.name}</td>
                    <td className={styles['description-cell']}>
                      {publisher.description}
                    </td>
                    <td>{publisher.countryName || '—'}</td>
                    <td>{formatDate(publisher.createdAt)}</td>
                    <td>
                      {publisher.updatedAt
                        ? formatDate(publisher.updatedAt)
                        : '—'}
                    </td>
                    <td>
                      <button
                        onClick={() => startEditing(publisher)}
                        className={styles['btn btn-warning']}
                        disabled={
                          deleteMutation.isPending || updateMutation.isPending
                        }
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(publisher.id)}
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
