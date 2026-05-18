import { useState } from 'react';
import { useDeleteContent } from '@/api/contents';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './ContentManagement.module.css';
import { useNavigate } from 'react-router-dom';
import { ContentList } from '@/components/Contents/ContentList';
import { AlertDialog } from '@/components/dialogs/AlertDialog';

export const ContentManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const deleteMutation = useDeleteContent();
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [deletingContentId, setDeletingContentId] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(deletingContentId);
    setDeleteModalOpen(true);
  };

  const apiFilter = {
    searchQuery: debouncedSearch,
    limit: 20,
    lastId: null,
  };

  return (
    <div className={styles['content-management']}>
      <h2>Управление контентами</h2>

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

      <AlertDialog
        description={`Это действие нельзя будет отменить`}
        open={deleteModalOpen}
        title={`Вы действительно хотите удалить этот контент?`}
        handleAccept={() => {
          handleDelete();
          setDeleteModalOpen(false);
        }}
        handleReject={() => {
          setDeleteModalOpen(false);
          setDeletingContentId(0);
        }}
      />

      <div className={styles['contents-list']}>
        <ContentList
          filter={apiFilter}
          renderActions={(content) => (
            <button
              onClick={() => {
                setDeletingContentId(content.id);
                setDeleteModalOpen(true);
              }}
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
