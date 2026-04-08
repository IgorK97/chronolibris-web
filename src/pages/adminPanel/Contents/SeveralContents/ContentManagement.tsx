import React, { useState } from 'react';
import { useDeleteContent } from '@/api/contents';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './ContentManagement.module.css';
import { useNavigate } from 'react-router-dom';
import { ContentList } from '@/components/contents/ContentList';

export const ContentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const deleteMutation = useDeleteContent();
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

  const apiFilter = {
    searchQuery: debouncedSearch,
    limit: 20,
  };

  return (
    <div className={styles['content-management']}>
      <h2>Управление контентом</h2>

      <div className={styles['top-actions']}>
        <button
          onClick={() => navigate('/contents/new')}
          className={styles['btn']}
        >
          Создать новый контент
        </button>
      </div>

      <div className={styles['filters-grid']}>
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
      </div>

      <div className={styles['contents-list']}>
        <ContentList
          filter={apiFilter}
          renderActions={(content) => (
            <button
              onClick={() => handleDelete(content.id)}
              className={`${styles['btn']} ${styles['btn-danger']}`}
              disabled={deleteMutation.isPending}
            >
              Удалить
            </button>
          )}
          onTitleClick={(content) => navigate(`/contents/${content.id}/edit`)}
          additionalColumns={[{ header: 'Книг', render: (c) => c.booksCount }]}
        />
      </div>
    </div>
  );
};
