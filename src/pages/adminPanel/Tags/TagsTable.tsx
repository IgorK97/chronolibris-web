// // components/Tags/TagsTable.tsx
// import React, { useState } from 'react';
// import { useTags, useDeleteTag, useTagTypes, TAG_TYPES } from '@/api/tags';
// import styles from './TagsTable.module.css';

// interface TagsTableProps {
//   onTagSelect?: (tagId: number) => void;
// }

// export const TagsTable: React.FC<TagsTableProps> = ({ onTagSelect }) => {
//   const [selectedType, setSelectedType] = useState<number | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [page, setPage] = useState(1);
//   const pageSize = 20;

//   const { data: tagsData, isLoading } = useTags(
//     selectedType,
//     searchTerm || null,
//     page,
//     pageSize
//   );

//   const { data: tagTypes } = useTagTypes();
//   const deleteMutation = useDeleteTag();

//   const handleDelete = (tagId: number) => {
//     if (window.confirm('Вы уверены, что хотите удалить этот тег?')) {
//       deleteMutation.mutate(tagId);
//     }
//   };

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     setPage(1);
//   };

//   const handleTypeChange = (typeId: number | null) => {
//     setSelectedType(typeId);
//     setPage(1);
//   };

//   return (
//     <div className={styles['container']}>
//       <div className={styles['filters']}>
//         <div className={styles['filter-group']}>
//           <label className={styles['label']}>Тип тега:</label>
//           <select
//             value={selectedType || ''}
//             onChange={(e) =>
//               handleTypeChange(e.target.value ? Number(e.target.value) : null)
//             }
//             className={styles['select']}
//           >
//             <option value="">Все типы</option>
//             {TAG_TYPES.map((type) => (
//               <option key={type.id} value={type.id}>
//                 {type.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         <form onSubmit={handleSearch} className={styles['search-form']}>
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder="Поиск по названию..."
//             className={styles['input']}
//           />
//           <button type="submit" className={styles['search-button']}>
//             Найти
//           </button>
//         </form>
//       </div>

//       {isLoading ? (
//         <div className={styles['loading']}>Загрузка...</div>
//       ) : (
//         <>
//           <table className={styles['table']}>
//             <thead>
//               <tr>
//                 <th className={styles['th']}>ID</th>
//                 <th className={styles['th']}>Название</th>
//                 <th className={styles['th']}>Тип</th>
//                 <th className={styles['th']}>Действия</th>
//               </tr>
//             </thead>
//             <tbody>
//               {tagsData?.items.map((tag) => (
//                 <tr key={tag.id} className={styles['tr']}>
//                   <td className={styles['td']}>{tag.id}</td>
//                   <td className={styles['td']}>{tag.name}</td>
//                   <td className={styles['td']}>
//                     {tag.tagTypeName ||
//                       TAG_TYPES.find((t) => t.id === tag.tagTypeId)?.name ||
//                       tag.tagTypeId}
//                   </td>
//                   <td className={styles['td']}>
//                     <button
//                       onClick={() => handleDelete(tag.id)}
//                       className={styles['delete-button']}
//                       disabled={deleteMutation.isPending}
//                     >
//                       {deleteMutation.isPending ? '...' : 'Удалить'}
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {tagsData && tagsData.items.length === 0 && (
//             <div className={styles['empty']}>Теги не найдены</div>
//           )}

//           <div className={styles['pagination']}>
//             <button
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               disabled={page === 1}
//               className={styles['page-button']}
//             >
//               ← Назад
//             </button>
//             <span className={styles['page-info']}>
//               Страница {page} из{' '}
//               {Math.ceil((tagsData?.totalCount || 0) / pageSize)}
//             </span>
//             <button
//               onClick={() => setPage((p) => p + 1)}
//               disabled={!tagsData?.hasNext}
//               className={styles['page-button']}
//             >
//               Вперёд →
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// components/Tags/TagsTable.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  useDeleteTag,
  // useTagTypes,
  TAG_TYPES,
  useInfiniteTags,
} from '@/api/tags'; // Импорт нового хука
import { useDebounce } from '@/hooks/useDebounce'; // Импорт дебаунса
import styles from './TagsTable.module.css';

interface TagsTableProps {
  onTagSelect?: (tagId: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const TagsTable: React.FC<TagsTableProps> = ({ onTagSelect }) => {
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 20;

  // 1. Дебаунс для поиска (запрос отправится через 500мс после остановки ввода)
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 2. Используем бесконечный запрос вместо постраничного
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteTags(selectedType, debouncedSearch || null, pageSize);

  const deleteMutation = useDeleteTag();
  const observerRef = useRef<HTMLDivElement | null>(null);

  // 3. Intersection Observer для бесконечного скролла
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Сглаживаем массив страниц в один плоский список тегов
  const allTags = data?.pages.flatMap((page) => page.items) || [];

  const handleDelete = (tagId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тег?')) {
      deleteMutation.mutate(tagId);
    }
  };

  const handleTypeChange = (typeId: number | null) => {
    setSelectedType(typeId);
  };

  return (
    <div className={styles['container']}>
      <div className={styles['filters']}>
        <div className={styles['filter-group']}>
          <label className={styles['label']}>Тип тега:</label>
          <select
            value={selectedType || ''}
            onChange={(e) =>
              handleTypeChange(e.target.value ? Number(e.target.value) : null)
            }
            className={styles['select']}
          >
            <option value="">Все типы</option>
            {TAG_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles['search-form']}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по названию..."
            className={styles['input']}
          />
          {/* Кнопка теперь не обязательна для отправки, но можно оставить для UI */}
        </div>
      </div>

      {isLoading ? (
        <div className={styles['loading']}>Загрузка...</div>
      ) : (
        <>
          <table className={styles['table']}>
            <thead>
              <tr>
                <th className={styles['th']}>ID</th>
                <th className={styles['th']}>Название</th>
                <th className={styles['th']}>Тип</th>
                <th className={styles['th']}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {allTags.map((tag) => (
                <tr key={tag.id} className={styles['tr']}>
                  <td className={styles['td']}>{tag.id}</td>
                  <td className={styles['td']}>{tag.name}</td>
                  <td className={styles['td']}>
                    {tag.tagTypeName ||
                      TAG_TYPES.find((t) => t.id === tag.tagTypeId)?.name ||
                      tag.tagTypeId}
                  </td>
                  <td className={styles['td']}>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className={styles['delete-button']}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? '...' : 'Удалить'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {allTags.length === 0 && !isLoading && (
            <div className={styles['empty']}>Теги не найдены</div>
          )}

          {/* Триггер для загрузки следующей порции данных */}
          <div ref={observerRef} className={styles['loader-trigger']}>
            {isFetchingNextPage
              ? 'Загрузка новых тегов...'
              : hasNextPage
                ? 'Прокрутите ниже для загрузки'
                : allTags.length > 0
                  ? 'Все теги загружены'
                  : ''}
          </div>
        </>
      )}
    </div>
  );
};
