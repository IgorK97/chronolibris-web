/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  usePublishers,
  useCreatePublisher,
  useUpdatePublisher,
  useDeletePublisher,
} from '@/api/publishers';
import type {
  CreatePublisherRequest,
  PublisherDto,
  UpdatePublisherRequest,
} from '@/types';
import styles from './PublisherManager.module.css';
import { AlertDialog } from '@/components/dialogs/AlertDialog';

export const PublisherManager: React.FC = () => {
  const { data: publishers, isLoading, error } = usePublishers();
  const createMutation = useCreatePublisher();
  const updateMutation = useUpdatePublisher();
  const deleteMutation = useDeletePublisher();

  const [deletingPublisherId, setDeletingPublisherId] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState<CreatePublisherRequest>({
    name: '',
    description: '',
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

    try {
      await createMutation.mutateAsync(formData);
      setFormData({ name: '', description: '' });
    } catch (err: any) {
      console.error('Ошибка создания издательства:', err);
      alert(err.response?.data?.message || 'Ошибка создания издательства');
    }
  };

  const handleUpdate = async (
    id: number,
    name: string,
    description: string
  ) => {
    if (!name.trim()) {
      alert('Название издательства обязательно');
      return;
    }

    if (!description.trim()) {
      alert('Описание издательства обязательно');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        data: { id, name, description } as UpdatePublisherRequest,
      });
      setEditingId(null);
      setEditFormData(null);
    } catch (err: any) {
      console.error('Ошибка обновления издательства:', err);
      alert(err.response?.data?.message || 'Ошибка обновления издательства');
    }
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(deletingPublisherId);
    setDeleteModalOpen(false);
  };

  const startEditing = (publisher: PublisherDto) => {
    setEditingId(publisher.id);
    setEditFormData({
      id: publisher.id,
      name: publisher.name,
      description: publisher.description,
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

      <div className={styles['form-section']}>
        <h3>Добавить новое издательство</h3>
        <div className={styles['form-grid']}>
          <div className="form-group">
            <p>Название</p>
            <input
              type="text"
              placeholder="Название издательства"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles['input-field']}
              maxLength={256}
            />
          </div>

          <div className={styles['form-group']}>
            <label>Описание</label>
            <textarea
              placeholder="Описание издательства"
              maxLength={2000}
              minLength={20}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={styles['input-field textarea']}
              rows={3}
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={
              createMutation.isPending ||
              !formData.name.trim() ||
              formData.description.length < 20
            }
            className={styles['btn']}
          >
            {createMutation.isPending ? 'Создание...' : 'Создать издательство'}
          </button>
        </div>
      </div>

      <div className={styles['list-section']}>
        <h3>Список издательств ({publishers?.length || 0})</h3>
        <table className={styles['publishers-table']}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Описание</th>
              <th>Создано</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {publishers?.map((publisher) => (
              <tr key={publisher.id}>
                {editingId === publisher.id ? (
                  <>
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
                        maxLength={256}
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
                        minLength={20}
                        maxLength={2000}
                      />
                    </td>
                    <td>{formatDate(publisher.createdAt)}</td>
                    <td>
                      <button
                        onClick={() =>
                          handleUpdate(
                            publisher.id,
                            editFormData?.name || '',
                            editFormData?.description || ''
                          )
                        }
                        className={`${styles['btn']} ${styles['btn-update']}`}
                        disabled={
                          updateMutation.isPending ||
                          !editFormData?.name.trim() ||
                          editFormData.description.length < 20
                        }
                      >
                        {updateMutation.isPending
                          ? 'Сохранение...'
                          : 'Сохранить'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className={`${styles['btn']} ${styles['btn-danger']}`}
                        disabled={updateMutation.isPending}
                      >
                        Отмена
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={styles['name-cell']}>{publisher.name}</td>
                    <td className={styles['description-cell']}>
                      {publisher.description}
                    </td>
                    <td>{formatDate(publisher.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => startEditing(publisher)}
                        className={`${styles['btn']} ${styles['btn-update']}`}
                        disabled={
                          deleteMutation.isPending || updateMutation.isPending
                        }
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => {
                          setDeletingPublisherId(publisher.id);
                          setDeleteModalOpen(true);
                        }}
                        className={`${styles['btn']} ${styles['btn-danger']}`}
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
      <AlertDialog
        description={`Это действие нельзя будет отменить`}
        open={deleteModalOpen}
        title={`Вы действительно хотите удалить это издательство?`}
        handleAccept={() => {
          handleDelete();
        }}
        handleReject={() => {
          setDeleteModalOpen(false);
          setDeletingPublisherId(0);
        }}
      />
    </div>
  );
};
