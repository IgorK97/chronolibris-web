/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import styles from './SimpleEntityManager.module.css';
import { AlertDialog } from '@/components/dialogs/AlertDialog';

export interface SimpleEntity {
  id: number;
  name: string;
}

export interface SimpleEntityManagerProps {
  title: string;
  createLabel: string;
  createPlaceholder?: string;
  maxLength?: number;

  items: SimpleEntity[] | undefined;
  isLoading: boolean;
  error: Error | null | unknown;

  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;

  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export const SimpleEntityManager: React.FC<SimpleEntityManagerProps> = ({
  title,
  createLabel,
  createPlaceholder = 'Название',
  maxLength = 256,
  items,
  isLoading,
  error,
  onCreate,
  onUpdate,
  onDelete,
  isCreating,
  isUpdating,
  isDeleting,
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingEntityId, setDeletingEntityId] = useState(0);

  const handleCreate = async () => {
    if (!newName.trim()) {
      alert('Название обязательно');
      return;
    }
    try {
      await onCreate(newName.trim());
      setNewName('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Ошибка создания');
    }
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      alert('Название обязательно');
      return;
    }
    if (editingId === null) return;
    try {
      await onUpdate(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Ошибка обновления');
    }
  };

  const handleDelete = async () => {
    await onDelete(deletingEntityId);
  };

  const startEditing = (item: SimpleEntity) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  if (isLoading) {
    return (
      <div className={styles.manager}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.manager}>
        <div className={styles.error}>Ошибка: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className={styles.manager}>
      <h2>{title}</h2>

      <div className={styles['form-section']}>
        <h3>Добавить новый элемент</h3>
        <div className={styles['form-group']}>
          <input
            type="text"
            placeholder={createPlaceholder}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className={styles['input-field']}
            maxLength={maxLength}
          />
          <button
            onClick={handleCreate}
            disabled={isCreating || !newName.trim()}
            className={`${styles.btn}`}
          >
            {isCreating ? 'Создание...' : createLabel}
          </button>
        </div>
      </div>

      <div className={styles['list-section']}>
        <h3>Список ({items?.length ?? 0})</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) =>
              editingId === item.id ? (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate();
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      className={styles['input-field']}
                      maxLength={maxLength}
                      autoFocus
                    />
                  </td>
                  <td className={styles.actions}>
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className={`${styles.btn} ${styles['btn-update']}`}
                    >
                      {isUpdating ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isUpdating}
                      className={`${styles.btn} ${styles['btn-danger']}`}
                    >
                      Отмена
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td className={styles.actions}>
                    <button
                      onClick={() => startEditing(item)}
                      disabled={isDeleting || isUpdating}
                      className={`${styles.btn} ${styles['btn-update']}`}
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => {
                        setDeletingEntityId(item.id);
                        setDeleteModalOpen(true);
                      }}
                      disabled={isDeleting || isUpdating}
                      className={`${styles.btn} ${styles['btn-danger']}`}
                    >
                      {isDeleting ? 'Удаление...' : 'Удалить'}
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <AlertDialog
        description={`Это действие нельзя будет отменить`}
        open={deleteModalOpen}
        title={`Вы действительно хотите это удалить?`}
        handleAccept={() => {
          handleDelete();
          setDeleteModalOpen(false);
        }}
        handleReject={() => {
          setDeleteModalOpen(false);
          setDeletingEntityId(0);
        }}
      />
    </div>
  );
};
