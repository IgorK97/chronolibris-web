/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/PersonManager.tsx
import React, {
  useState,
  // useRef
} from 'react';
import {
  usePersons,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
} from '@/api/persons';
import type { CreatePersonRequest, UpdatePersonRequest } from '@/types';
// import {
//   fileToBase64,
//   validateFileSize,
//   validateFileType,
// } from '@/utils/imageUtils';
import styles from './PersonManager.module.css';
import type { PersonDto } from '@/types';

export const PersonManager: React.FC = () => {
  const { data: persons, isLoading, error } = usePersons();
  const createMutation = useCreatePerson();
  const updateMutation = useUpdatePerson();
  const deleteMutation = useDeletePerson();

  const [formData, setFormData] = useState<CreatePersonRequest>({
    name: '',
    description: '',
    // imageBase64: undefined,
    // fileName: undefined,
  });

  // const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<UpdatePersonRequest | null>(
    null
  );

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Имя персоны обязательно');
      return;
    }

    if (!formData.description.trim()) {
      alert('Описание персоны обязательно');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setFormData({
        name: '',
        description: '',
        // imageBase64: undefined,
        // fileName: undefined,
      });
      // setPreviewImage(null);
      // if (fileInputRef.current) {
      //   fileInputRef.current.value = '';
      // }
    } catch (err: any) {
      console.error('Ошибка создания персоны:', err);
      alert(err.response?.data?.message || 'Ошибка создания персоны');
    }
  };

  const handleUpdate = async (
    id: number,
    name: string,
    description: string
    // imageBase64?: string,
    // fileName?: string
  ) => {
    if (!name.trim()) {
      alert('Имя персоны обязательно');
      return;
    }

    if (!description.trim()) {
      alert('Описание персоны обязательно');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          id,
          name,
          description,
          // imageBase64,
          // fileName,
        } as UpdatePersonRequest,
      });
      setEditingId(null);
      setEditFormData(null);
      // setEditPreviewImage(null);
      // if (editFileInputRef.current) {
      //   editFileInputRef.current.value = '';
      // }
    } catch (err: any) {
      console.error('Ошибка обновления персоны:', err);
      alert(err.response?.data?.message || 'Ошибка обновления персоны');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту персону?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        console.error('Ошибка удаления персоны:', err);
        alert(err.response?.data?.message || 'Ошибка удаления персоны');
      }
    }
  };

  const startEditing = (person: PersonDto) => {
    setEditingId(person.id);
    setEditFormData({
      id: person.id,
      name: person.name,
      description: person.description,
      // imageBase64: undefined,
      // fileName: undefined,
    });
    // setEditPreviewImage(person.imageUrl || null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData(null);
    // setEditPreviewImage(null);
    // if (editFileInputRef.current) {
    //   editFileInputRef.current.value = '';
    // }
  };

  if (isLoading) {
    return (
      <div className={styles['person-manager']}>
        <div className={styles['loading']}>Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['person-manager']}>
        <div className={styles['error']}>
          Ошибка: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className={styles['person-manager']}>
      <h2>Управление персонами</h2>

      {/* Форма создания */}
      <div className={styles['form-section']}>
        <h3>Добавить новую персону</h3>
        <div className={styles['form-grid']}>
          <div className={styles['form-group']}>
            <label>Имя *</label>
            <input
              type="text"
              placeholder="Имя персоны (например: Лев Толстой)"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles['input-field']}
              maxLength={255}
            />
          </div>

          <div className={styles['form-group']}>
            <label>Описание *</label>
            <textarea
              placeholder="Краткое описание персоны"
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
              !formData.description.trim()
            }
            className={styles['btn']}
          >
            {createMutation.isPending ? 'Создание...' : 'Создать персону'}
          </button>
        </div>
      </div>

      {/* Список персон */}
      <div className={styles['list-section']}>
        <h3>Список персон ({persons?.length || 0})</h3>
        <table className={styles['persons-table']}>
          <thead>
            <tr>
              {/* <th>ID</th> */}
              {/* <th>Изображение</th> */}
              <th>Имя</th>
              <th>Описание</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {persons?.map((person) => (
              <tr key={person.id}>
                {editingId === person.id ? (
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
                      <button
                        onClick={() =>
                          handleUpdate(
                            person.id,
                            editFormData?.name || '',
                            editFormData?.description || ''
                            // editFormData?.imageBase64,
                            // editFormData?.fileName
                          )
                        }
                        className={`${styles['btn']} ${styles['btn-update']}`}
                        disabled={updateMutation.isPending}
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
                    <td className={styles['name-cell']}>{person.name}</td>
                    <td
                      className={styles['description-cell']}
                      title={person.description}
                    >
                      {person.description}
                    </td>
                    <td>
                      <button
                        onClick={() => startEditing(person)}
                        className={`${styles['btn']} ${styles['btn-update']}`}
                        disabled={
                          deleteMutation.isPending || updateMutation.isPending
                        }
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(person.id)}
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
    </div>
  );
};
