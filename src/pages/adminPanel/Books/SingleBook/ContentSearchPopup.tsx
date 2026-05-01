/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
// import { useContents } from '@/api/contents';
import type { ContentDto, ContentFilterRequest } from '@/types';
import styles from './ContentSearchPopup.module.css';
import { useDebounce } from '@/hooks/useDebounce';
import { X } from 'lucide-react';
import { ContentList } from '@/components/Contents/ContentList';

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
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  // const [filter, setFilter] = useState<ContentFilterRequest>({
  //   searchQuery: debouncedSearch,
  //   limit: 20,
  //   lastId: null,
  // });

  const filter: ContentFilterRequest = {
    searchQuery: debouncedSearch,
    limit: 20,
    lastId: null,
  };

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal-content']}>
        <div className={styles['modal-header']}>
          <h3>Поиск контента для добавления</h3>
          <button onClick={onClose} className={styles['btn-close']}>
            <X style={{ cursor: 'pointer' }} />
          </button>
        </div>

        <div className={styles['modal-body']}>
          <div className={styles['search-bar']}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию..."
              className={styles['input-field']}
            />
          </div>

          <ContentList
            filter={filter}
            renderActions={(content) => (
              <button
                onClick={() => onSelectContent(content)}
                className={styles['btn-select']}
              >
                Выбрать
              </button>
            )}
            additionalColumns={[
              { header: 'Тип', render: (c) => c.contentType },
            ]}
          />
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
