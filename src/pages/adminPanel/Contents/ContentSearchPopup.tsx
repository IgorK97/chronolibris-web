/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { useContents } from '@/api/contents';
import type { ContentDto, ContentFilterRequest } from '@/types/types';
import styles from './ContentSearchPopup.module.css';

interface ContentSearchPopupProps {
  onClose: () => void;
  onSelectContent: (content: ContentDto) => void;
  currentBookId: number;
}

export const ContentSearchPopup: React.FC<ContentSearchPopupProps> = ({
  onClose,
  onSelectContent,
  currentBookId,
}) => {
  const [filter, setFilter] = useState<ContentFilterRequest>({
    searchQuery: '',
    limit: 20,
  });

  const { data: contents, isLoading } = useContents(filter);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, searchQuery: e.target.value });
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

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal-content']}>
        <div className={styles['modal-header']}>
          <h3>Поиск контента для добавления</h3>
          <button onClick={onClose} className={styles['btn-close']}>
            ✕
          </button>
        </div>

        <div className={styles['modal-body']}>
          <div className={styles['search-bar']}>
            <input
              type="text"
              value={filter.searchQuery || ''}
              onChange={handleSearch}
              placeholder="Поиск по названию..."
              className={styles['input-field']}
            />
          </div>

          {isLoading ? (
            <div className={styles['loading']}>Загрузка...</div>
          ) : (
            <table className={styles['contents-table']}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Год</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {contents?.items.map((content) => (
                  <tr key={content.id}>
                    <td>{content.id}</td>
                    <td>{content.title}</td>
                    <td>{content.contentType}</td>
                    <td>{content.year || '—'}</td>
                    <td>
                      <button
                        onClick={() => onSelectContent(content)}
                        className={styles['btn-select']}
                      >
                        Выбрать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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
              className={styles['btn-page']}
            >
              Вперед →
            </button>
          </div>
        </div>

        <div className={styles['modal-footer']}>
          <button onClick={onClose} className={styles['btn-close-footer']}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
