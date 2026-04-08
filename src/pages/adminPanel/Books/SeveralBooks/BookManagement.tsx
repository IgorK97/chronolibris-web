/*eslint-disable @typescript-eslint/no-explicit-any*/
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks, useDeleteBook } from '@/api/books';
import type { BookFilterRequest, BookDto } from '@/types';
import { useThemes } from '@/api/themes';
import styles from './BookManagement.module.css';

export const BookManagement: React.FC = () => {
  const navigate = useNavigate();

  const [filter, setFilter] = useState<BookFilterRequest>({
    searchQuery: '',
    authorName: '',
    includeThemeIds: [],
    excludeThemeIds: [],
    limit: 20,
  });

  const { data: books, isLoading, error } = useBooks(filter);
  const deleteMutation = useDeleteBook();
  const { data: themes } = useThemes();

  const handleSelectBook = (book: BookDto) => {
    navigate(`/books/${book.id}`);
  };

  const handleCreateBook = () => {
    navigate('/books/new');
  };

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
    if (window.confirm('Вы уверены, что хотите удалить эту книгу?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка удаления');
      }
    }
  };

  const handleNextPage = () => {
    if (books?.nextCursor) {
      setFilter({ ...filter, cursor: books.nextCursor });
    }
  };

  const handlePrevPage = () => {
    if (books?.prevCursor) {
      setFilter({ ...filter, cursor: books.prevCursor });
    }
  };

  if (isLoading) return <div className={styles['loading']}>Загрузка...</div>;
  if (error)
    return (
      <div className={styles['error']}>Ошибка: {(error as Error).message}</div>
    );

  return (
    <div className={styles['book-management']}>
      <div className={styles['header-actions']}>
        <h2>Управление книгами</h2>
        <button
          onClick={handleCreateBook}
          className={styles['btn btn-primary']}
        >
          + Создать книгу
        </button>
      </div>

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
          <label>Автор (контента)</label>
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

      {/* Список книг */}
      <div className={styles['books-list']}>
        <table className={styles['books-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>ISBN</th>
              <th>Авторы</th>
              <th>Темы</th>
              <th>Контентов</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {books?.items.map((book) => (
              <tr key={book.id}>
                <td>{book.id}</td>
                <td
                  className={styles['clickable']}
                  onClick={() => handleSelectBook(book)}
                >
                  {book.title}
                </td>
                <td>{book.isbn || '—'}</td>
                <td>{book.authors.join(', ')}</td>
                <td>{book.themes.map((t) => t.name).join(', ')}</td>
                <td>{book.contentsCount}</td>
                <td>
                  <button
                    onClick={() => handleSelectBook(book)}
                    className={styles['btn btn-primary btn-sm']}
                  >
                    Открыть
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
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
            disabled={!books?.prevCursor}
            className={styles['btn btn-secondary']}
          >
            ← Назад
          </button>
          <span>
            {books?.items.length} из {books?.totalCount}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!books?.hasMore}
            className={styles['btn btn-secondary']}
          >
            Вперед →
          </button>
        </div>
      </div>
    </div>
  );
};
