/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/ContentUnit.tsx
import React, { useState } from 'react';
import {
  useContentById,
  useContentBooks,
  useUnlinkBookFromContent,
  useLinkBookToContent,
} from '@/api/contents';
// import { useBooks } from '../api/books';
import type { ContentDto, BookDto, BookFilterRequest } from '@/types/types';
import { BookSearchPopup } from './BookSearchPopup';
import styles from './ContentUnit.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { ContentTagsManager } from './ContentTagsManagement';

interface ContentUnitProps {
  contentId: number;
  onBack: () => void;
}

export const ContentUnit = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const id = contentId ? parseInt(contentId, 10) : null;

  const { data: content, isLoading, error } = useContentById(id);
  const { data: books, refetch: refetchBooks } = useContentBooks(id);
  const unlinkMutation = useUnlinkBookFromContent();
  const linkMutation = useLinkBookToContent();

  const [showBookSearch, setShowBookSearch] = useState(false);

  const handleUnlinkBook = async (bookId: number) => {
    if (window.confirm('Отвязать эту книгу от контента?')) {
      try {
        await unlinkMutation.mutateAsync({ contentId: id!, bookId });
        refetchBooks();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка');
      }
    }
  };

  const handleAddBook = async (book: BookDto) => {
    if (window.confirm(`Добавить книгу "${book.title}" к этому контенту?`)) {
      try {
        await linkMutation.mutateAsync({
          contentId: id!,
          bookId: book.id,
          data: {
            contentId: id!,
            bookId: book.id,
            order: (books?.length || 0) + 1,
          },
        });
        setShowBookSearch(false);
        refetchBooks();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка');
      }
    }
  };

  const handleBack = () => {
    navigate('/contents');
  };

  if (isLoading) return <div className="loading">Загрузка...</div>;
  if (error || !content) return <div className="error">Контент не найден</div>;

  return (
    <div className={styles['content-unit']}>
      <div className={styles['content-unit-header']}>
        <button onClick={handleBack} className={styles['btn btn-secondary']}>
          ← Назад к списку
        </button>
        <h2>{content.title}</h2>
      </div>

      {/* Метаданные контента */}
      <div className={styles['content-metadata']}>
        <div className={styles['metadata-section']}>
          <h3>Основная информация</h3>
          <div className={styles['metadata-grid']}>
            <div className={styles['metadata-item']}>
              <label>ID:</label>
              <span>{content.id}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Название:</label>
              <span>{content.title}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Описание:</label>
              <span>{content.description}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Тип:</label>
              <span>{content.contentType}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Язык:</label>
              <span>{content.languageName}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Страна:</label>
              <span>{content.countryName}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Год:</label>
              <span>{content.year || '—'}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Авторы:</label>
              <span>{content.authors.join(', ') || '—'}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Темы:</label>
              <span>{content.themes.map((t) => t.name).join(', ') || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Управление тегами */}
      {id && <ContentTagsManager contentId={id} />}

      {/* Список книг */}
      <div className={styles['books-section']}>
        <div className={styles['books-header']}>
          <h3>Книги ({books?.length || 0})</h3>
          <button
            onClick={() => setShowBookSearch(true)}
            className={styles['btn btn-primary']}
          >
            + Добавить книгу
          </button>
        </div>

        <table className={styles['books-table']}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>ISBN</th>
              <th>Издательство</th>
              <th>Серия</th>
              <th>Доступно</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {books?.map((book, index) => (
              <tr key={book.id}>
                <td>{book.id}</td>
                <td>{book.title}</td>
                <td>{book.isbn || '—'}</td>
                <td>{book.publisherName || '—'}</td>
                <td>{book.seriesName || '—'}</td>
                <td>{book.isAvailable ? '✓' : '✗'}</td>
                <td>
                  <button
                    onClick={() => handleUnlinkBook(book.id)}
                    className={styles['btn btn-danger btn-sm']}
                    disabled={unlinkMutation.isPending}
                  >
                    Отвязать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Попап поиска книг */}
      {showBookSearch && (
        <BookSearchPopup
          onClose={() => setShowBookSearch(false)}
          onSelectBook={handleAddBook}
          currentContentId={id!}
        />
      )}
    </div>
  );
};
