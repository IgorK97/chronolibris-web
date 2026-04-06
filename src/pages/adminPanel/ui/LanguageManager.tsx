// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import React, { useState } from 'react';
// import {
//   useLanguages,
//   useFtsConfigurations,
//   useCreateLanguage,
//   useUpdateLanguage,
//   useDeleteLanguage,
// } from '@/api/references';
// import type {
//   CreateLanguageRequest,
//   UpdateLanguageRequest,
// } from '@/types/types';

// export const LanguageManager: React.FC = () => {
//   const { data: languages, isLoading: languagesLoading } = useLanguages();
//   // const { data: ftsConfigs, isLoading: configsLoading } =
//   //   useFtsConfigurations();
//   const createMutation = useCreateLanguage();
//   const updateMutation = useUpdateLanguage();
//   const deleteMutation = useDeleteLanguage();

//   const [formData, setFormData] = useState<CreateLanguageRequest>({
//     name: '',
//     // ftsConfiguration: '',
//   });

//   const [editingId, setEditingId] = useState<number | null>(null);

//   const handleCreate = async () => {
//     if (!formData.name) {
//       alert('Заполните все поля');
//       return;
//     }

//     try {
//       await createMutation.mutateAsync(formData);
//       setFormData({ name: '' });
//     } catch (err: any) {
//       alert('Ошибка создания языка');
//     }
//   };

//   const handleUpdate = async (id: number, name: string) => {
//     try {
//       await updateMutation.mutateAsync({
//         id,
//         data: { id, name } as UpdateLanguageRequest,
//       });
//       setEditingId(null);
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (err: any) {
//       alert('Ошибка обновления языка');
//     }
//   };

//   const handleDelete = async (id: number) => {
//     if (window.confirm('Вы уверены, что хотите удалить этот язык?')) {
//       try {
//         await deleteMutation.mutateAsync(id);
//       } catch (err: unknown) {
//         alert('Ошибка удаления языка');
//       }
//     }
//   };

//   if (languagesLoading) {
//     return <div>Загрузка...</div>;
//   }

//   return (
//     <div className="language-manager">
//       <h2>Управление языками</h2>

//       {/* Форма создания/редактирования */}
//       <div className="form-group">
//         <input
//           type="text"
//           placeholder="Название языка"
//           value={formData.name}
//           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//           className="input-field"
//         />

//         <button
//           onClick={handleCreate}
//           disabled={createMutation.isPending}
//           className="btn-primary"
//         >
//           {createMutation.isPending ? 'Создание...' : 'Создать язык'}
//         </button>
//       </div>

//       {/* Список языков */}
//       <table className="languages-table">
//         <thead>
//           <tr>
//             <th>ID</th>
//             <th>Название</th>
//             {/* <th>FTS Конфигурация</th> */}
//             <th>Действия</th>
//           </tr>
//         </thead>
//         <tbody>
//           {languages?.map((lang) => (
//             <tr key={lang.id}>
//               {editingId === lang.id ? (
//                 <>
//                   <td>{lang.id}</td>
//                   <td>
//                     <input
//                       type="text"
//                       defaultValue={lang.name}
//                       id={`edit-name-${lang.id}`}
//                       className="input-field"
//                     />
//                   </td>

//                   <td>
//                     <button
//                       onClick={() => {
//                         const nameInput = document.getElementById(
//                           `edit-name-${lang.id}`
//                         ) as HTMLInputElement;

//                         handleUpdate(lang.id, nameInput.value);
//                       }}
//                       className="btn-success"
//                     >
//                       Сохранить
//                     </button>
//                     <button
//                       onClick={() => setEditingId(null)}
//                       className="btn-secondary"
//                     >
//                       Отмена
//                     </button>
//                   </td>
//                 </>
//               ) : (
//                 <>
//                   <td>{lang.id}</td>
//                   <td>{lang.name}</td>
//                   <td>
//                     <button
//                       onClick={() => {
//                         setEditingId(lang.id);
//                         setFormData({
//                           name: lang.name,
//                         });
//                       }}
//                       className="btn-warning"
//                     >
//                       Редактировать
//                     </button>
//                     <button
//                       onClick={() => handleDelete(lang.id)}
//                       className="btn-danger"
//                       disabled={deleteMutation.isPending}
//                     >
//                       Удалить
//                     </button>
//                   </td>
//                 </>
//               )}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

import {
  useLanguages,
  useCreateLanguage,
  useUpdateLanguage,
  useDeleteLanguage,
} from '@/api/references';
import { SimpleEntityManager } from './SimpleEntityManager';

export const LanguageManager = () => {
  const { data, isLoading, error } = useLanguages();
  const create = useCreateLanguage();
  const update = useUpdateLanguage();
  const del = useDeleteLanguage();

  return (
    <SimpleEntityManager
      title="Управление языками"
      createLabel="Создать язык"
      createPlaceholder="Название языка"
      items={data}
      isLoading={isLoading}
      error={error}
      onCreate={async (name) => {
        const res = () => create.mutateAsync({ name });
        res();
      }}
      onUpdate={(id, name) => update.mutateAsync({ id, data: { id, name } })}
      onDelete={(id) => del.mutateAsync(id)}
      isCreating={create.isPending}
      isUpdating={update.isPending}
      isDeleting={del.isPending}
    />
  );
};
