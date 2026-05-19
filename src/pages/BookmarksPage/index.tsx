import React, { useState } from 'react';
import { Bookmark, Search, BookOpen, Hash, FileType } from 'lucide-react';
import { useMyBookmarksPaged } from '@/api/bookmarks';
import styles from './index.module.css';
import { useDebounce } from '@/hooks';
import { BookFileStatuses, type BookmarkWithBookDetails } from '@/types';
import { useStore } from '@/stores/globalStore';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 20;

const getStatusBadge = (statusId: number) => {
  const statusMap: Record<number, { label: string; color: string }> = {
    [BookFileStatuses.COMPLETED]: { label: 'Читать', color: '#2F5C57' },
    [BookFileStatuses.ARCHIVE]: { label: 'Архив', color: '#6F4F46' },
  };
  const status = statusMap[statusId] ?? null;
  return (
    status && (
      <span
        className={styles['status-badge']}
        style={{ backgroundColor: status.color }}
      >
        {status.label}
      </span>
    )
  );
};

export default function BookmarksPage() {
  const [inputValue, setInputValue] = useState('');
  const searchDeb = useDebounce(inputValue, 200);
  const navigate = useNavigate();

  const { setPendingBookmarkNav } = useStore();
  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useMyBookmarksPaged(PAGE_SIZE, searchDeb);

  const allBookmarks = data?.pages.flatMap((page) => page.items) ?? [];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const handleBookmarkClick = (bm: BookmarkWithBookDetails) => {
    setPendingBookmarkNav({
      bookFileId: bm.bookFileId,
      xpointer: bm.xpointer,
    });
    navigate(`/reader/${bm.bookFileId}`);
  };

  return (
    <div
      style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
      className={styles.layout}
    >
      <div
        style={{ width: '100%', alignItems: 'center' }}
        className={styles.main}
      >
        <div className={styles['search-wrapper']}>
          <Search size={16} className={styles['search-icon']} />
          <input
            className={styles['search-input']}
            type="text"
            placeholder="Поиск по названию или заметке…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        {isLoading && <p className={styles.info}>Загрузка…</p>}
        {error && <p className={styles.error}>{error.message}</p>}

        {allBookmarks.length > 0 && (
          <ul className={styles.list}>
            {allBookmarks.map((bm) => (
              <li key={bm.id}>
                <button
                  className={styles['bookmark-row']}
                  onClick={() => handleBookmarkClick(bm)}
                  title="Открыть в читалке"
                >
                  <span className={styles['row-icon']}>
                    <Bookmark size={18} strokeWidth={1.5} />
                  </span>
                  <span className={styles['row-body']}>
                    <span className={styles['row-title']}>
                      <BookOpen size={13} className={styles['inline-icon']} />
                      <span className={styles['book-title']}>
                        {bm.bookTitle}
                      </span>
                    </span>
                    <span className={styles['row-file']}>
                      <FileType size={13} className={styles['inline-icon']} />
                      <span className={styles['file-format']}>
                        {bm.bookFileFormatName}
                      </span>
                      {getStatusBadge(bm.bookFileStatusId)}
                    </span>
                    <span className={styles['row-context']}>{bm.context}</span>
                    {bm.note && (
                      <span className={styles['row-note']}>{bm.note}</span>
                    )}
                  </span>
                  <span className={styles['row-date']}>
                    {formatDate(bm.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasNextPage && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '20px 0',
            }}
          >
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className={styles['page-btn']}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              {isFetchingNextPage ? 'Загрузка...' : 'Загрузить еще'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
