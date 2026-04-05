// /* eslint-disable @typescript-eslint/no-explicit-any */
// // File: src/components/ContentManagement.tsx
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   // useContents,
//   useDeleteContent,
//   useInfiniteContents,
// } from '@/api/contents';
// import type { ContentFilterRequest, ContentDto } from '@/types/types';
// // import { useThemes } from '@/api/themes';
// import styles from './ContentManagement.module.css';
// import { useNavigate } from 'react-router-dom';

// // interface ContentManagementProps {
// //   onSelectContent: (content: ContentDto) => void;
// // }

// export const ContentManagement: React.FC = () => {
//   const navigate = useNavigate();
//   const [filter, setFilter] = useState<ContentFilterRequest>({
//     searchQuery: '',
//     authorName: '',
//     // includeThemeIds: [],
//     // excludeThemeIds: [],
//     limit: 20,
//   });

//   // const { data: contents, isLoading, error } = useContents(filter);
//   const deleteMutation = useDeleteContent();
//   // const { data: themes } = useThemes();

//   const [localSearch, setLocalSearch] = useState(filter.searchQuery || '');
//   const [localAuthor, setLocalAuthor] = useState(filter.authorName || '');

//   // const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//   //   setFilter({ ...filter, searchQuery: e.target.value });
//   // };

//   // const handleAuthorFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
//   //   setFilter({ ...filter, authorName: e.target.value });
//   // };

//   // 2. Дебаунс: обновляем основной фильтр только через 500мс после остановки ввода
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setFilter((prev) => ({
//         ...prev,
//         searchQuery: localSearch,
//         authorName: localAuthor,
//       }));
//     }, 500);

//     return () => clearTimeout(handler);
//   }, [localSearch, localAuthor]);

//   // const handleThemeToggle = (themeId: number, include: boolean) => {
//   //   if (include) {
//   //     setFilter({
//   //       ...filter,
//   //       includeThemeIds: [...(filter.includeThemeIds || []), themeId],
//   //     });
//   //   } else {
//   //     setFilter({
//   //       ...filter,
//   //       excludeThemeIds: [...(filter.excludeThemeIds || []), themeId],
//   //     });
//   //   }
//   // };

//   const {
//     data,
//     isLoading,
//     error,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//   } = useInfiniteContents(filter);

//   const observerRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
//           fetchNextPage();
//         }
//       },
//       { threshold: 1.0 }
//     );

//     if (observerRef.current) observer.observe(observerRef.current);
//     return () => observer.disconnect();
//   }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
//   const allContents = data?.pages.flatMap((page) => page.items) || [];
//   const handleDelete = async (id: number) => {
//     if (window.confirm('Вы уверены, что хотите удалить этот контент?')) {
//       try {
//         await deleteMutation.mutateAsync(id);
//       } catch (err: any) {
//         alert(err.response?.data?.message || 'Ошибка удаления');
//       }
//     }
//   };

//   const handleSelectContent = (content: ContentDto) => {
//     // Переход на страницу контента по ID
//     navigate(`/contents/${content.id}/edit`);
//   };

//   // const handleNextPage = () => {
//   //   if (contents?.nextCursor) {
//   //     setFilter({ ...filter, cursor: contents.nextCursor });
//   //   }
//   // };

//   // const handlePrevPage = () => {
//   //   if (contents?.prevCursor) {
//   //     setFilter({ ...filter, cursor: contents.prevCursor });
//   //   }
//   // };

//   if (isLoading) return <div className={styles['loading']}>Загрузка...</div>;
//   if (error)
//     return (
//       <div className={styles['error']}>Ошибка: {(error as Error).message}</div>
//     );

//   return (
//     <div className={styles['content-management']}>
//       <h2>Управление контентом</h2>
//       <button>
//         <a href="/contents/new">Создать новый контент</a>
//       </button>

//       {/* Фильтры */}
//       <div className={styles['filters-section']}>
//         <div className={styles['filter-group']}>
//           <label>Поиск по названию</label>
//           <input
//             type="text"
//             value={filter.searchQuery || ''}
//             onChange={(e) => setLocalSearch(e.target.value)}
//             placeholder="Введите название..."
//             className={styles['input-field']}
//           />
//         </div>

//         <div className={styles['filter-group']}>
//           <label>Автор</label>
//           <input
//             type="text"
//             value={filter.authorName || ''}
//             onChange={(e) => setLocalAuthor(e.target.value)}
//             placeholder="Имя одного автора..."
//             className={styles['input-field']}
//           />
//         </div>

//         {/* <div className={styles['filter-group']}>
//           <label>Темы (включение)</label>
//           <select
//             onChange={(e) => {
//               const themeId = Number(e.target.value);
//               if (themeId) handleThemeToggle(themeId, true);
//             }}
//             className={styles['input-field']}
//           >
//             <option value="">Выберите тему</option>
//             {themes?.map((theme) => (
//               <option key={theme.id} value={theme.id}>
//                 {theme.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className={styles['filter-group']}>
//           <label>Темы (исключение)</label>
//           <select
//             onChange={(e) => {
//               const themeId = Number(e.target.value);
//               if (themeId) handleThemeToggle(themeId, false);
//             }}
//             className={styles['input-field']}
//           >
//             <option value="">Выберите тему</option>
//             {themes?.map((theme) => (
//               <option key={theme.id} value={theme.id}>
//                 {theme.name}
//               </option>
//             ))}
//           </select>
//         </div> */}
//       </div>

//       {/* Список контентов */}
//       <div className={styles['contents-list']}>
//         <table className={styles['contents-table']}>
//           <thead>
//             <tr>
//               <th>ID</th>
//               <th>Название</th>
//               <th>Авторы</th>
//               {/* <th>Темы</th> */}
//               <th>Книг</th>
//               <th>Действия</th>
//             </tr>
//           </thead>
//           <tbody>
//             {allContents?.map((content) => (
//               <tr key={content.id}>
//                 <td>{content.id}</td>
//                 <td
//                   className={styles['clickable']}
//                   onClick={() => handleSelectContent(content)}
//                 >
//                   {content.title}
//                 </td>
//                 <td
//                   className={styles['authors-cell']}
//                   title={content.authors.join(', ')}
//                 >
//                   {content.authors.join(', ')}
//                 </td>
//                 {/* <td>{content.themes.map((t) => t.name).join(', ')}</td> */}
//                 <td>{content.booksCount}</td>
//                 <td>
//                   <button
//                     onClick={() => handleSelectContent(content)}
//                     className={styles['btn btn-primary btn-sm']}
//                   >
//                     Открыть
//                   </button>
//                   <button
//                     onClick={() => handleDelete(content.id)}
//                     className={styles['btn btn-danger btn-sm']}
//                     disabled={deleteMutation.isPending}
//                   >
//                     Удалить
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {/* Сентинел для отслеживания конца списка */}
//         <div ref={observerRef} className={styles['loader-trigger']}>
//           {isFetchingNextPage
//             ? 'Загрузка новых данных...'
//             : hasNextPage
//               ? 'Прокрутите ниже для загрузки'
//               : 'Все данные загружены'}
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { useEffect, useRef, useState } from 'react';
import { useDeleteContent, useInfiniteContents } from '@/api/contents';
// import { usePersonRoles } from '@api/searchReference';
// import {
//   PersonFilter,
//   type PersonRoleFilterRequest,
// } from '@components/Filters/PersonFilter';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './ContentManagement.module.css';
import { useNavigate } from 'react-router-dom';

export const ContentManagement: React.FC = () => {
  const navigate = useNavigate();
  // const { data: roles = [] } = usePersonRoles();

  // 1. Состояние фильтров
  const [searchQuery, setSearchQuery] = useState('');
  // const [personFilters, setPersonFilters] = useState<PersonRoleFilterRequest[]>(
  //   []
  // );
  const deleteMutation = useDeleteContent();
  // 2. Дебаунс только для текстового поиска
  const debouncedSearch = useDebounce(searchQuery, 500);
  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот контент?')) {
      try {
        await deleteMutation.mutateAsync(id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка удаления');
      }
    }
  };
  // 3. Формируем итоговый объект фильтра для API
  // Фильтр по персоналиям обновляется мгновенно в этом стейте,
  // но запрос сработает только когда personFilters изменится (внутри useInfiniteContents)
  const apiFilter = {
    searchQuery: debouncedSearch,
    // personFilters: personFilters,
    limit: 20,
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteContents(apiFilter);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Intersection Observer для бесконечного скролла
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allContents = data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className={styles['content-management']}>
      <h2>Управление контентом</h2>

      <div className={styles['top-actions']}>
        <button
          onClick={() => navigate('/contents/new')}
          className={styles['btn-create']}
        >
          Создать новый контент
        </button>
      </div>

      <div className={styles['filters-grid']}>
        {/* Поиск по названию с "ленивым" обновлением */}
        <div className={styles['filter-group']}>
          <label>Поиск по названию</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите название..."
            className={styles['input-field']}
          />
        </div>

        {/* Переиспользуемый компонент персоналий */}
        {/* <PersonFilter
          value={personFilters}
          roles={roles}
          onChange={(newFilters) => setPersonFilters(newFilters)}
        /> */}
      </div>

      <div className={styles['contents-list']}>
        {isLoading ? (
          <div className={styles['loading']}>Загрузка...</div>
        ) : (
          <table className={styles['contents-table']}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Авторы</th>
                <th>Книг</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {allContents.map((content) => (
                <tr key={content.id}>
                  <td>{content.id}</td>
                  <td
                    className={styles['clickable']}
                    onClick={() => navigate(`/contents/${content.id}/edit`)}
                  >
                    {content.title}
                  </td>
                  <td>{content.authors.join(', ')}</td>
                  <td>{content.booksCount}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/contents/${content.id}/edit`)}
                    >
                      Открыть
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className={styles['btn btn-danger btn-sm']}
                      disabled={deleteMutation.isPending}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div ref={observerRef} className={styles['loader-trigger']}>
          {isFetchingNextPage
            ? 'Загрузка...'
            : hasNextPage
              ? 'Загрузить еще'
              : 'Конец списка'}
        </div>
      </div>
    </div>
  );
};
