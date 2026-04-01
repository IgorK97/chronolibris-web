/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/ContentManagement.tsx
import React, { useState } from 'react';
import { useContents, useDeleteContent } from '@/api/contents';
import type { ContentFilterRequest, ContentDto } from '@/types/types';
import { useThemes } from '@/api/themes';
import styles from './ContentManagement.module.css';
import { useNavigate } from 'react-router-dom';

// interface ContentManagementProps {
//   onSelectContent: (content: ContentDto) => void;
// }

export const ContentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ContentFilterRequest>({
    searchQuery: '',
    authorName: '',
    includeThemeIds: [],
    excludeThemeIds: [],
    limit: 20,
  });

  const { data: contents, isLoading, error } = useContents(filter);
  const deleteMutation = useDeleteContent();
  const { data: themes } = useThemes();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, searchQuery: e.target.value });
  };

  const handleAuthorFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, authorName: e.target.value });
  };

  const handleThemeToggle = (themeId: number, include: boolean) => {
    if (include) {
      setFilter({
        ...filter,
        includeThemeIds: [...(filter.includeThemeIds || []), themeId],
      });
    } else {
      setFilter({
        ...filter,
        excludeThemeIds: [...(filter.excludeThemeIds || []), themeId],
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот контент?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка удаления');
      }
    }
  };

  const handleSelectContent = (content: ContentDto) => {
    // Переход на страницу контента по ID
    navigate(`/contents/${content.id}/edit`);
  };

  const handleNextPage = () => {
    if (contents?.nextCursor) {
      setFilter({ ...filter, cursor: contents.nextCursor });
    }
  };

  const handlePrevPage = () => {
    if (contents?.prevCursor) {
      setFilter({ ...filter, cursor: contents.prevCursor });
    }
  };

  if (isLoading) return <div className={styles['loading']}>Загрузка...</div>;
  if (error)
    return (
      <div className={styles['error']}>Ошибка: {(error as Error).message}</div>
    );

  return (
    <div className={styles['content-management']}>
      <h2>Управление контентом</h2>
      <button>
        <a href="/contents/new">Создать новый контент</a>
      </button>

      {/* Фильтры */}
      <div className={styles['filters-section']}>
        <div className={styles['filter-group']}>
          <label>Поиск по названию</label>
          <input
            type="text"
            value={filter.searchQuery || ''}
            onChange={handleSearch}
            placeholder="Введите название..."
            className={styles['input-field']}
          />
        </div>

        <div className={styles['filter-group']}>
          <label>Автор</label>
          <input
            type="text"
            value={filter.authorName || ''}
            onChange={handleAuthorFilter}
            placeholder="Имя автора..."
            className={styles['input-field']}
          />
        </div>

        <div className={styles['filter-group']}>
          <label>Темы (включение)</label>
          <select
            onChange={(e) => {
              const themeId = Number(e.target.value);
              if (themeId) handleThemeToggle(themeId, true);
            }}
            className={styles['input-field']}
          >
            <option value="">Выберите тему</option>
            {themes?.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles['filter-group']}>
          <label>Темы (исключение)</label>
          <select
            onChange={(e) => {
              const themeId = Number(e.target.value);
              if (themeId) handleThemeToggle(themeId, false);
            }}
            className={styles['input-field']}
          >
            <option value="">Выберите тему</option>
            {themes?.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Список контентов */}
      <div className={styles['contents-list']}>
        <table className={styles['contents-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Авторы</th>
              <th>Темы</th>
              <th>Книг</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {contents?.items.map((content) => (
              <tr key={content.id}>
                <td>{content.id}</td>
                <td
                  className={styles['clickable']}
                  onClick={() => handleSelectContent(content)}
                >
                  {content.title}
                </td>
                <td>{content.authors.join(', ')}</td>
                <td>{content.themes.map((t) => t.name).join(', ')}</td>
                <td>{content.booksCount}</td>
                <td>
                  <button
                    onClick={() => handleSelectContent(content)}
                    className={styles['btn btn-primary btn-sm']}
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

        {/* Пагинация */}
        <div className={styles['pagination']}>
          <button
            onClick={handlePrevPage}
            disabled={!contents?.prevCursor}
            className={styles['btn btn-secondary']}
          >
            ← Назад
          </button>
          <span>
            {contents?.items.length} из {contents?.totalCount}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!contents?.hasMore}
            className={styles['btn btn-secondary']}
          >
            Вперед →
          </button>
        </div>
      </div>
    </div>
  );
};
