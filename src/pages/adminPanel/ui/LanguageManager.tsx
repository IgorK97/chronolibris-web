/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// // File: src/components/LanguageManager.tsx
// import React, { useState } from 'react';
// import {
//   useLanguages,
//   useCreateLanguage,
//   useUpdateLanguage,
//   useDeleteLanguage,
// } from '@/api/references';
// import type {
//   CreateLanguageRequest,
//   UpdateLanguageRequest,
// } from '@/types/types';

// export const LanguageManager: React.FC = () => {
//   const { data: languages, isLoading, error } = useLanguages();
//   const createMutation = useCreateLanguage();
//   const updateMutation = useUpdateLanguage();
//   const deleteMutation = useDeleteLanguage();

//   const [formData, setFormData] = useState<CreateLanguageRequest>({
//     name: '',
//     ftsConfiguration: 'russian',
//   });

//   const handleCreate = async () => {
//     try {
//       await createMutation.mutateAsync(formData);
//       setFormData({ name: '', ftsConfiguration: 'russian' });
//     } catch (err) {
//       console.error('Ошибка создания языка:', err);
//     }
//   };

//   const handleUpdate = async (
//     id: number,
//     name: string,
//     ftsConfiguration: string
//   ) => {
//     try {
//       await updateMutation.mutateAsync({
//         id,
//         data: { id, name, ftsConfiguration } as UpdateLanguageRequest,
//       });
//     } catch (err) {
//       console.error('Ошибка обновления языка:', err);
//     }
//   };

//   const handleDelete = async (id: number) => {
//     if (window.confirm('Вы уверены, что хотите удалить этот язык?')) {
//       try {
//         await deleteMutation.mutateAsync(id);
//       } catch (err) {
//         console.error('Ошибка удаления языка:', err);
//       }
//     }
//   };

//   if (isLoading) return <div>Загрузка...</div>;
//   if (error) return <div>Ошибка: {(error as Error).message}</div>;

//   return (
//     <div>
//       <h2>Управление языками</h2>

//       {/* Форма создания */}
//       <div>
//         <input
//           type="text"
//           placeholder="Название языка"
//           value={formData.name}
//           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//         />
//         <select
//           value={formData.ftsConfiguration}
//           onChange={(e) =>
//             setFormData({ ...formData, ftsConfiguration: e.target.value })
//           }
//         >
//           <option value="russian">Russian</option>
//           <option value="english">English</option>
//           <option value="german">German</option>
//           <option value="french">French</option>
//           <option value="spanish">Spanish</option>
//         </select>
//         <button onClick={handleCreate} disabled={createMutation.isPending}>
//           Создать
//         </button>
//       </div>

//       {/* Список языков */}
//       <ul>
//         {languages?.map((lang) => (
//           <li key={lang.id}>
//             {lang.name} ({lang.ftsConfiguration})
//             <button
//               onClick={() =>
//                 handleUpdate(lang.id, lang.name, lang.ftsConfiguration)
//               }
//             >
//               Редактировать
//             </button>
//             <button onClick={() => handleDelete(lang.id)}>Удалить</button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// File: src/components/LanguageManager.tsx
import React, { useState } from 'react';
import {
  useLanguages,
  useFtsConfigurations,
  useCreateLanguage,
  useUpdateLanguage,
  useDeleteLanguage,
} from '@/api/references';
import type {
  CreateLanguageRequest,
  UpdateLanguageRequest,
} from '@/types/types';

export const LanguageManager: React.FC = () => {
  const { data: languages, isLoading: languagesLoading } = useLanguages();
  const { data: ftsConfigs, isLoading: configsLoading } =
    useFtsConfigurations();
  const createMutation = useCreateLanguage();
  const updateMutation = useUpdateLanguage();
  const deleteMutation = useDeleteLanguage();

  const [formData, setFormData] = useState<CreateLanguageRequest>({
    name: '',
    ftsConfiguration: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!formData.name || !formData.ftsConfiguration) {
      alert('Заполните все поля');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setFormData({ name: '', ftsConfiguration: '' });
    } catch (err: any) {
      if (err.response?.data?.availableConfigurations) {
        alert(
          `Доступные конфигурации: ${err.response.data.availableConfigurations.join(', ')}`
        );
      } else {
        alert('Ошибка создания языка');
      }
    }
  };

  const handleUpdate = async (
    id: number,
    name: string,
    ftsConfiguration: string
  ) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { id, name, ftsConfiguration } as UpdateLanguageRequest,
      });
      setEditingId(null);
    } catch (err: any) {
      if (err.response?.data?.availableConfigurations) {
        alert(
          `Доступные конфигурации: ${err.response.data.availableConfigurations.join(', ')}`
        );
      } else {
        alert('Ошибка обновления языка');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот язык?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: unknown) {
        alert('Ошибка удаления языка');
      }
    }
  };

  if (languagesLoading || configsLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="language-manager">
      <h2>Управление языками</h2>

      {/* Форма создания/редактирования */}
      <div className="form-group">
        <input
          type="text"
          placeholder="Название языка"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field"
        />

        <select
          value={formData.ftsConfiguration}
          onChange={(e) =>
            setFormData({ ...formData, ftsConfiguration: e.target.value })
          }
          className="select-field"
        >
          <option value="">Выберите FTS конфигурацию</option>
          {ftsConfigs?.map((config) => (
            <option key={config.configOid} value={config.configName}>
              {config.configName} (OID: {config.configOid})
            </option>
          ))}
        </select>

        <button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="btn-primary"
        >
          {createMutation.isPending ? 'Создание...' : 'Создать язык'}
        </button>
      </div>

      {/* Список языков */}
      <table className="languages-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>FTS Конфигурация</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {languages?.map((lang) => (
            <tr key={lang.id}>
              {editingId === lang.id ? (
                <>
                  <td>{lang.id}</td>
                  <td>
                    <input
                      type="text"
                      defaultValue={lang.name}
                      id={`edit-name-${lang.id}`}
                      className="input-field"
                    />
                  </td>
                  <td>
                    <select
                      defaultValue={lang.ftsConfiguration}
                      id={`edit-fts-${lang.id}`}
                      className="select-field"
                    >
                      {ftsConfigs?.map((config) => (
                        <option
                          key={config.configOid}
                          value={config.configName}
                        >
                          {config.configName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById(
                          `edit-name-${lang.id}`
                        ) as HTMLInputElement;
                        const ftsSelect = document.getElementById(
                          `edit-fts-${lang.id}`
                        ) as HTMLSelectElement;
                        handleUpdate(lang.id, nameInput.value, ftsSelect.value);
                      }}
                      className="btn-success"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-secondary"
                    >
                      Отмена
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{lang.id}</td>
                  <td>{lang.name}</td>
                  <td>{lang.ftsConfiguration}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingId(lang.id);
                        setFormData({
                          name: lang.name,
                          ftsConfiguration: lang.ftsConfiguration,
                        });
                      }}
                      className="btn-warning"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(lang.id)}
                      className="btn-danger"
                      disabled={deleteMutation.isPending}
                    >
                      Удалить
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
