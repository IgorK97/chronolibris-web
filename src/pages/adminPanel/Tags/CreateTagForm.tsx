// // components/Tags/CreateTagForm.tsx
// import React, { useState } from 'react';
// import { useCreateTag, TAG_TYPES } from '@/api/tags';
// import styles from './CreateTagForm.module.css';

// interface CreateTagFormProps {
//   onSuccess?: () => void;
// }

// export const CreateTagForm: React.FC<CreateTagFormProps> = ({ onSuccess }) => {
//   const [name, setName] = useState('');
//   const [tagTypeId, setTagTypeId] = useState<number>(1);
//   const createMutation = useCreateTag();

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!name.trim()) return;

//     createMutation.mutate(
//       { name: name.trim(), tagTypeId },
//       {
//         onSuccess: () => {
//           setName('');
//           onSuccess?.();
//         },
//       }
//     );
//   };

//   return (
//     <form onSubmit={handleSubmit} className={styles['container']}>
//       <h3 className={styles['title']}>Добавить тег</h3>

//       <div className={styles['form-group']}>
//         <label className={styles['label']}>Название тега:</label>
//         <input
//           type="text"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className={styles['input']}
//           placeholder="Введите название тега"
//           required
//         />
//       </div>

//       <div className={styles['form-group']}>
//         <label className={styles['label']}>Тип тега:</label>
//         <select
//           value={tagTypeId}
//           onChange={(e) => setTagTypeId(Number(e.target.value))}
//           className={styles['select']}
//         >
//           {TAG_TYPES.map((type) => (
//             <option key={type.id} value={type.id}>
//               {type.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       <button
//         type="submit"
//         className={styles['submit-button']}
//         disabled={createMutation.isPending || !name.trim()}
//       >
//         {createMutation.isPending ? 'Создание...' : 'Создать'}
//       </button>

//       {createMutation.isError && (
//         <div className={styles['error']}>Ошибка при создании тега</div>
//       )}
//     </form>
//   );
// };

// components/Tags/CreateTagForm.tsx
import React, { useState } from 'react';
import { useCreateTag, TAG_TYPES, RELATION_TYPES } from '@/api/tags';
import type { TagDetails } from '@/types/types';
import styles from './CreateTagForm.module.css';

interface CreateTagFormProps {
  selectedParentTag: TagDetails | null;
  onParentTagClear: () => void;
  onSuccess?: () => void;
}

export const CreateTagForm: React.FC<CreateTagFormProps> = ({
  selectedParentTag,
  onParentTagClear,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [tagTypeId, setTagTypeId] = useState<number>(1);
  const [relationTypeId, setRelationTypeId] = useState<number>(
    RELATION_TYPES[0].id
  );

  const createMutation = useCreateTag();
  // const { data: relationTypes } = useRelationTypes();
  const effectiveRelationTypes = RELATION_TYPES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate(
      {
        name: name.trim(),
        tagTypeId,
        parentTagId: selectedParentTag?.id ?? null,
        relationTypeId: selectedParentTag ? relationTypeId : null,
      },
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

      {/* Родительский тег */}
      <div className={styles['form-group']}>
        <label className={styles['label']}>Родительский тег:</label>
        {selectedParentTag ? (
          <div className={styles['parent-tag-selected']}>
            <span className={styles['parent-tag-type-badge']}>
              {TAG_TYPES.find((t) => t.id === selectedParentTag.tagTypeId)
                ?.name ?? selectedParentTag.tagTypeName}
            </span>
            <span className={styles['parent-tag-name']}>
              {selectedParentTag.name}
            </span>
            <button
              type="button"
              onClick={onParentTagClear}
              className={styles['clear-parent-button']}
              aria-label="Убрать родительский тег"
            >
              ✕
            </button>
          </div>
        ) : (
          <p className={styles['parent-tag-hint']}>
            Кликните на тег в таблице ниже, чтобы выбрать родителя
          </p>
        )}
      </div>

      {/* Тип отношения — только если выбран родитель */}
      {selectedParentTag && (
        <div className={styles['form-group']}>
          <label className={styles['label']}>Тип отношения:</label>
          <select
            value={relationTypeId}
            onChange={(e) => setRelationTypeId(Number(e.target.value))}
            className={styles['select']}
          >
            {effectiveRelationTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
          {effectiveRelationTypes.find((rt) => rt.id === relationTypeId)
            ?.description && (
            <p className={styles['relation-hint']}>
              {
                effectiveRelationTypes.find((rt) => rt.id === relationTypeId)
                  ?.description
              }
            </p>
          )}
        </div>
      )}

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
