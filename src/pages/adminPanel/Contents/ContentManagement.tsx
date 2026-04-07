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
