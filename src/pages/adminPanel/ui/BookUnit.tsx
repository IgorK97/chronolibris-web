/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/components/BookUnit.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useBookById,
  useBookContents,
  useUnlinkContentFromBook,
  useLinkContentToBook,
} from '@/api/books';
import type { ContentDto } from '@/types/types';
import { ContentSearchPopup } from './ContentSearchPopup';
import styles from './BookUnit.module.css';

export const BookUnit: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const id = bookId && bookId !== 'new' ? parseInt(bookId, 10) : null;
  const isNew = bookId === 'new';

  const { data: book, isLoading, error } = useBookById(id);
  const { data: contents, refetch: refetchContents } = useBookContents(id);
  const unlinkMutation = useUnlinkContentFromBook();
  const linkMutation = useLinkContentToBook();

  const [showContentSearch, setShowContentSearch] = useState(false);

  const handleBack = () => {
    navigate('/books');
  };

  const handleUnlinkContent = async (contentId: number) => {
    if (window.confirm('Удалить этот контент из книги?')) {
      try {
        await unlinkMutation.mutateAsync({ bookId: id!, contentId });
        refetchContents();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка');
      }
    }
  };

  const handleAddContent = async (content: ContentDto) => {
    if (window.confirm(`Добавить контент "${content.title}" к этой книге?`)) {
      try {
        await linkMutation.mutateAsync({
          bookId: id!,
          contentId: content.id,
          data: {
            bookId: id!,
            contentId: content.id,
            order: (contents?.length || 0) + 1,
          },
        });
        setShowContentSearch(false);
        refetchContents();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Ошибка');
      }
    }
  };

  if (isLoading) return <div className={styles['loading']}>Загрузка...</div>;
  if (error || (!book && !isNew))
    return <div className={styles['error']}>Книга не найдена</div>;

  return (
    <div className={styles['book-unit']}>
      <div className={styles['book-unit-header']}>
        <button onClick={handleBack} className={styles['btn btn-secondary']}>
          ← Назад к списку
        </button>
        <h2>{book?.title || 'Новая книга'}</h2>
      </div>

      {/* Метаданные книги */}
      <div className={styles['book-metadata']}>
        <div className={styles['metadata-section']}>
          <h3>Основная информация</h3>
          <div className={styles['metadata-grid']}>
            <div className={styles['metadata-item']}>
              <label>ID:</label>
              <span>{book?.id || '—'}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Название:</label>
              <span>{book?.title}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Описание:</label>
              <span>{book?.description}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>ISBN:</label>
              <span>{book?.isbn || '—'}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Язык:</label>
              <span>{book?.languageName}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Страна:</label>
              <span>{book?.countryName}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Год:</label>
              <span>{book?.year || '—'}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Издательство:</label>
              <span>{book?.publisherName || '—'}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Серия:</label>
              <span>{book?.seriesName || '—'}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Авторы:</label>
              <span>{book?.authors.join(', ') || '—'}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Темы:</label>
              <span>{book?.themes.map((t) => t.name).join(', ') || '—'}</span>
            </div>
            <div className={styles['metadata-item']}>
              <label>Доступно:</label>
              <span>{book?.isAvailable ? '✓' : '✗'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Список контентов */}
      <div className={styles['contents-section']}>
        <div className={styles['contents-header']}>
          <h3>Контенты в книге ({contents?.length || 0})</h3>
          <button
            onClick={() => {
              console.log('KUKUKU');
              setShowContentSearch(true);
            }}
            className={styles['btn btn-primary']}
          >
            + Добавить контент
          </button>
        </div>

        <table className={styles['contents-table']}>
          <thead>
            <tr>
              <th>Порядок</th>
              <th>Название</th>
              <th>Тип</th>
              <th>Авторы</th>
              <th>Темы</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {contents?.map((content, index) => (
              <tr key={content.id}>
                <td>{index + 1}</td>
                <td>{content.title}</td>
                <td>{content.contentType}</td>
                <td>{content.authors.join(', ')}</td>
                <td>{content.themes.map((t) => t.name).join(', ')}</td>
                <td>
                  <button
                    onClick={() => handleUnlinkContent(content.id)}
                    className={styles['btn btn-danger btn-sm']}
                    disabled={unlinkMutation.isPending}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Placeholder для BookFiles */}
      <div className={styles['files-section']}>
        <h3>Файлы книги</h3>
        <div className={styles['files-placeholder']}>
          <p>Список файлов книги будет отображаться здесь</p>
          <p className={styles['hint']}>(Функционал в разработке)</p>
        </div>
      </div>

      {/* Попап поиска контентов */}
      {showContentSearch && (
        <ContentSearchPopup
          onClose={() => setShowContentSearch(false)}
          onSelectContent={handleAddContent}
          currentBookId={id!}
        />
      )}
    </div>
  );
};
