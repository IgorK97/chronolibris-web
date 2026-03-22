/* eslint-disable @typescript-eslint/no-unused-vars */
// import React from // useEffect,
// useState,
// "react";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  Download,
  ListPlus,
  SquareCheckBig,
  Square,
  WandSparkles,
  X,
  Plus,
  // XCircle,
  // ArrowUpCircle,
} from 'lucide-react';
import styles from './BookDetails.module.css';
import { useStore } from '../../../stores/globalStore';
import { booksApi, useBookDetails } from '../../../api/books';
import { useRoles } from '../../../api/references';
import type { BookDetails, ShelfDetails } from '../../../types/types';
import {
  collectionsApi,
  useSeekedShelves,
  useShelves,
} from '../../../api/collections';
import {
  favColor,
  fillFavColor,
  fillUnfavColor,
  getImageUrl,
} from '../../../utils';
import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// import { CommentsSection } from './CommentSection/CommentsSection';
import { BookTabs } from './BookTabs/BookTabs';
import { ParticipantsInfo } from './BookTabs/ParticipantsInfo';
import {
  reviewsApi,
  useCreateReview,
  useDeleteReview,
  useInfiniteReviews,
  useMyReview,
  useUpdateReview,
} from '@/api/reviews';
import { bookFilesApi, useBookFiles } from '@/api/bookFiles';
import Circles from 'react-loading-icons/dist/esm/components/circles';
import { ReportModal } from '@/components/reports/ui/ReportModal';
import { TARGET_TYPE } from '@/api/reports';
import { Flag } from 'lucide-react';
interface BookDetailsProps {
  onNavigateToReviews: (id: number) => void;
  onNavigateToRead: (bookFileId?: number) => void;
  onNavigateToBack: () => void;
  onReadClick: (bookFileId?: number) => void | Promise<void>;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

const FORMAT_EXTENSIONS: Record<number, string> = [
  'fb2', // 1
  'epub', // 2
  'pdf', // 3
  'mobi', // 4
];

function getAuthorsString(
  authorRoleId: number,
  bookDetails: BookDetails
): string {
  const authorGroup = bookDetails.participants.find(
    (group) => group.role === authorRoleId
  );
  if (!authorGroup || authorGroup.persons.length === 0)
    return 'Неизвестный автор';
  return authorGroup.persons.map((person) => person.fullName).join(', ');
}

export const BookDetailsComponent = ({
  onNavigateToReviews,
  onNavigateToRead,
  onNavigateToBack,
  onReadClick,
}: BookDetailsProps) => {
  // const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  // const [isNewVersionAvailable] = useState<boolean>(false);

  const { currentBook, setCurrentBook, user, isReader } = useStore();
  const { data: roles } = useRoles();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { data: seekedShelves, refetch: refetchSeekedShelves } =
    useSeekedShelves(currentBook?.id ?? 0);
  const { data: shelves, refetch: refetchShelves } = useShelves(
    user?.userId || 0
  );
  const [isAuth, setIsAuth] = useState(!!user);

  const FAVORITES_SHELF_ID = shelves?.find((s) => s.shelfType === 1)?.id;
  const READ_SHELF_ID = shelves?.find((s) => s.shelfType === 2)?.id;
  const bookId = currentBook ? currentBook.id : null;
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isRatingPopupOpen, setIsRatingPopupOpen] = useState(false);
  const ratingRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isShelfPanelOpen, setIsShelfPanelOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsRatingPopupOpen(true);
  };

  const { data: bookFiles, isLoading: filesLoading } = useBookFiles(
    bookId ?? 0
  );

  const [isDownloadPanelOpen, setIsDownloadPanelOpen] =
    useState<boolean>(false);

  const defaultBookFileId =
    bookFiles?.find((f) => f.isReadable)?.id ?? bookFiles?.[0]?.id;
  // console.log(defaultBookFileId, bookFiles![0]);
  const handleToggleShelf = async (shelf: ShelfDetails) => {
    const isOnShelf = seekedShelves?.includes(shelf.id);
    if (!bookId) return;
    const success = !isOnShelf
      ? await collectionsApi.addBookToShelf(shelf.id, bookId)
      : await collectionsApi.removeBookFromShelf(shelf.id, bookId);

    if (success) {
      refetchSeekedShelves();
    }
  };

  const { data: reviewsData, refetch: refetchReviews } = useInfiniteReviews(
    bookId ?? 0,
    isAuth
  );

  const { data: userReview } = useMyReview(bookId ?? 0, isAuth);

  const allReviews = reviewsData?.pages.flatMap((p) => p.items) ?? [];
  // const userReview =
  //   allReviews.find((r) => r.userName === user?.userName) ?? null;

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createReview = useCreateReview(bookId ?? 0);
  const updateReview = useUpdateReview(bookId ?? 0);
  const deleteReview = useDeleteReview(bookId ?? 0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const handleMouseLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    closeTimerRef.current = setTimeout(() => {
      // Проверяем, существует ли еще компонент, можно через ref
      setIsRatingPopupOpen(false);
      setHoverRating(0);
    }, 300);
    // closeTimerRef.current = setTimeout(() => {
    //   setIsRatingPopupOpen(false);
    //   setHoverRating(0);
    // }, 300); // enough time to move mouse into popup
  };
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
    // return () => {
    //   if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    // };
  }, []);
  const handleRateBook = async (rating: number) => {
    if (!user || !bookId) return;

    if (userReview) {
      // User already has a review — update score only, keep existing text
      // if (rating === userReview.score) {
      //   await deleteReview.mutateAsync(userReview.id);
      //   return;
      // }
      await updateReview.mutateAsync({
        reviewId: userReview.id,
        score: rating,
        reviewText: userReview.text || undefined,
      });
    } else {
      // No review yet — create a score-only one (server sets status = Published)

      await createReview.mutateAsync({
        bookId,
        score: rating,
      });
    }

    // Refetch book so averageRating / ratingsCount update in the header
    // refetchBook();
    setIsRatingPopupOpen(false);

    //   if (!user) return;
    //   const success = await reviewsApi.rateBook(
    //     fullBookDetails.id,
    //     // user.userId,
    //     rating
    //   );
    //   if (success) refetch();
    //   setIsRatingPopupOpen(false);
  };
  const handleCreateShelf = async () => {
    const trimmedName = newShelfName.trim();
    if (!trimmedName || !user) return;
    const newShelf = await collectionsApi.createShelf(trimmedName);
    if (newShelf != 0) {
      console.log('Created new shelf with ID:', newShelf);
      // await refetchSeekedShelves();
      await refetchShelves();
      setNewShelfName('');
      setIsCreating(false);
    }
  };
  const {
    data: fullBookDetails,
    refetch: refetchBook,
    isLoading,
    isError,
  } = useBookDetails(bookId ?? 0, user?.userId || 0, {
    enabled: !!bookId && !!user,
  });

  if (isLoading) return <div className={styles.loader}>Загрузка...</div>;
  if (isError || !fullBookDetails)
    return (
      <p className={styles.errorText}>
        Ошибка загрузки книги, попробуйте еще раз
      </p>
    );

  const authorRoleId = roles?.find((role) => role.name === 'Автор')?.id ?? 1;
  const authors = getAuthorsString(authorRoleId, fullBookDetails);
  console.log('FULLBOOK', fullBookDetails.id);
  const toggleShelfAction = async (
    shelfId: number | undefined,
    isCurrentStatus: boolean
  ) => {
    // console.log(
    //   `Toggling ----shelf ${shelfId} for book ${fullBookDetails.id}, current status: ${isCurrentStatus}`
    // );
    if (!user || !shelfId) return;
    const success = !isCurrentStatus
      ? await collectionsApi.addBookToShelf(shelfId, fullBookDetails.id)
      : await collectionsApi.removeBookFromShelf(shelfId, fullBookDetails.id);
    // console.log('Shelf toggle success:', success);
    // if (success) fetchBookDetails(user.userId, fullBookDetails.id);
    if (success) refetchBook();
  };

  const handleDownload = async (bookFileId: number, formatId: number) => {
    // Сервер сам резолвит путь для скачивания
    if (!bookFileId) return;
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const { blob } = await bookFilesApi.download(bookFileId);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = FORMAT_EXTENSIONS[formatId - 1];
      a.download = `${fullBookDetails.title}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setIsDownloadPanelOpen(false);
    } catch (error) {
      setDownloadError(t('book.download_error'));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={styles['container']}>
      <header className={styles['header']}>
        <button
          className={styles['icon-button']}
          onClick={() => {
            setCurrentBook(null);
            onNavigateToBack();
          }}
        >
          <ArrowLeft size={24} />
        </button>

        <div className={styles['header-icons']}>
          <button
            className={styles['icon-button']}
            onClick={() => {
              toggleShelfAction(READ_SHELF_ID, !!fullBookDetails.isRead);
            }}
          >
            <Bookmark
              size={24}
              color={fullBookDetails.isRead ? favColor : '#000'}
              fill={fullBookDetails.isRead ? favColor : 'none'}
            />
            <span className={styles['button-label']}>
              {fullBookDetails.isRead ? t('book.read_done') : t('book.to_read')}
            </span>
          </button>

          <button
            className={styles['icon-button']}
            onClick={() =>
              toggleShelfAction(
                FAVORITES_SHELF_ID,
                !!fullBookDetails.isFavorite
              )
            }
          >
            <Heart
              size={24}
              color={fullBookDetails.isFavorite ? favColor : '#000'}
              fill={fullBookDetails.isFavorite ? fillFavColor : fillUnfavColor}
            />
            <span className={styles['button-label']}>
              {fullBookDetails.isFavorite
                ? t('book.in_favorites')
                : t('book.to_favorites')}
            </span>
          </button>
          <button
            className={styles['icon-button']}
            onClick={() => setIsShelfPanelOpen(true)}
          >
            <ListPlus size={24} />
            <span className={styles['button-label']}>
              {t('book.add_to_collection')}
            </span>
          </button>
          {isShelfPanelOpen && (
            <div className={styles['shelf-panel']}>
              <button
                className={styles['shelf-panel-close']}
                onClick={() => {
                  setIsShelfPanelOpen(false);
                  setIsCreating(false);
                  setNewShelfName('');
                }}
              >
                <X />
              </button>

              <ul className={styles['shelf-list']}>
                {shelves?.map((shelf) => {
                  const isOnShelf = seekedShelves?.includes(shelf.id);
                  return (
                    <li key={shelf.id} className={styles['shelf-item']}>
                      <span className={styles['shelf-name']}>{shelf.name}</span>
                      <button
                        className={styles['shelf-toggle']}
                        onClick={() => handleToggleShelf(shelf)}
                      >
                        {isOnShelf ? (
                          <SquareCheckBig size={24} />
                        ) : (
                          <Square size={24} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {isCreating ? (
                <div className={styles['shelf-create-row']}>
                  <input
                    className={styles['shelf-create-row']}
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateShelf()}
                    placeholder="Название новой полки"
                    autoFocus
                  />
                  <button
                    className={styles['shelf-confirm']}
                    onClick={handleCreateShelf}
                  >
                    <WandSparkles size={20} />
                  </button>
                  <button
                    className={styles['shelf-cancel']}
                    onClick={() => {
                      setIsCreating(false);
                      setNewShelfName('');
                    }}
                  >
                    <X />
                  </button>
                </div>
              ) : (
                <button
                  className={styles['shelf-create-btn']}
                  onClick={() => setIsCreating(true)}
                >
                  <Plus /> {t('book.create_new_collection')}
                </button>
              )}
            </div>
          )}
          {/* <div className={styles['download-dropdown']}> */}
          <button
            className={styles['icon-button']}
            onClick={() => setIsDownloadPanelOpen((prev) => !prev)}
          >
            <Download size={24} />
            <span className={styles['button-label']}>{t('book.download')}</span>
          </button>
          {isDownloadPanelOpen &&
            bookFiles &&
            bookFiles.length > 0 &&
            createPortal(
              <div
                className={styles['panel-overlay']}
                onClick={() => setIsDownloadPanelOpen(false)}
              >
                <div
                  className={styles['download-panel']}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles['download-panel-header']}>
                    <span className={styles['download-panel-title']}>
                      {t('book.download')}
                    </span>
                    <button
                      className={styles['shelf-panel-close']}
                      onClick={() => setIsDownloadPanelOpen(false)}
                    >
                      <X />
                    </button>
                  </div>

                  {!bookFiles || bookFiles.length === 0 ? (
                    <p className={styles['download-panel-empty']}>
                      Файлы недоступны
                    </p>
                  ) : (
                    <ul className={styles['download-file-list']}>
                      {bookFiles.map((file) => (
                        <li
                          key={file.id}
                          className={styles['download-file-item']}
                          onClick={() => handleDownload(file.id, file.formatId)}
                        >
                          <span className={styles['download-file-format']}>
                            {FORMAT_EXTENSIONS[
                              (file.formatId ?? 1) - 1
                            ]?.toUpperCase() ?? ''}
                          </span>
                          <span className={styles['download-file-size']}>
                            {formatFileSize(file.fileSizeBytes)}
                          </span>
                          {isDownloading && <Circles />}
                        </li>
                      ))}
                    </ul>
                  )}
                  {downloadError && ( //Why () is necessary?
                    <p className={styles['download-error']}>{downloadError}</p>
                  )}
                </div>
              </div>,
              document.body
            )}
        </div>
      </header>

      <div className={styles['scroll-container']}>
        <div className={styles['book-body']}>
          <div className={styles['cover-container']}>
            <img
              src={getImageUrl(fullBookDetails.coverUri)}
              alt={fullBookDetails.title}
              className={styles['cover']}
            />
            {fullBookDetails.year && (
              <span className={styles['meta-text']}>
                {fullBookDetails.year} {t('book.year')}
              </span>
            )}

            {isReader() && (
              <button
                className={styles['report-book-btn']}
                onClick={() => setIsReportOpen(true)}
              >
                <Flag size={13} />
                Пожаловаться
              </button>
            )}
          </div>

          <div className={styles['book-meta']}>
            <div className={styles['short-info-container']}>
              <h1 className={styles['title']}>{fullBookDetails.title}</h1>
              <p className={styles['author']}>{authors}</p>
              {fullBookDetails.isReviewable && (
                <div className={styles['stats-row']}>
                  <div className={styles['stat-block']} ref={ratingRef}>
                    <div
                      className={styles['rating-trigger']}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <span className={styles['stat-icon']}>★</span>
                      <div className={styles['stat-content']}>
                        <span className={styles['stat-score']}>
                          {fullBookDetails.averageRating?.toFixed(1)}
                        </span>
                        <span className={styles['stat-count']}>
                          {fullBookDetails.ratingsCount}{' '}
                          {t('book.ratings_count')}
                        </span>
                      </div>
                      {fullBookDetails.userRating > 0 && (
                        <span className={styles['user-rating-badge']}>
                          {t('book.your_rating')}:{' '}
                          {fullBookDetails.userRating.toFixed(1)}★
                        </span>
                      )}
                      {isRatingPopupOpen && (
                        <div
                          className={styles['rating-popup']}
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                          <span className={styles['rating-popup-title']}>
                            {fullBookDetails.userRating
                              ? t('book.change_rating')
                              : t('book.rate_book')}
                          </span>
                          <div className={styles['stars-row']}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                className={`${styles['star-btn']} ${
                                  star <=
                                  (hoverRating || fullBookDetails.userRating)
                                    ? styles['star-btn-active']
                                    : ''
                                }`}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => handleRateBook(star)}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          {/* Секция удаления оценки и отзыва */}
                          {userReview && (
                            <div className={styles['delete-section']}>
                              <hr className={styles['separator']} />
                              <button
                                className={styles['delete-review-btn']}
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      t('book.confirm_delete_review')
                                    )
                                  ) {
                                    await deleteReview.mutateAsync(
                                      userReview.id
                                    );
                                    // Закрываем попап после удаления, если нужно
                                    setIsRatingPopupOpen(false);
                                  }
                                }}
                                disabled={deleteReview.isPending}
                              >
                                {deleteReview.isPending
                                  ? t('common.deleting')
                                  : t('book.delete_rating_and_review')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles['stat-divider']} />

                  <div className={styles['stat-block']}>
                    <span
                      className={`${styles['stat-icon']} ${styles['stat-icon--reviews']}`}
                    >
                      ✦
                    </span>
                    <div className={styles['stat-content']}>
                      <span className={styles['stat-score']}>
                        {fullBookDetails.reviewsCount}
                      </span>
                      <span className={styles['stat-count']}>
                        {t('book.review_count')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {/* <span className={styles['review-text']}>
                {fullBookDetails.reviewsCount} {t('book.review_count')}
              </span>
              <span className={styles['meta-text']}>
                {fullBookDetails.ratingsCount} {t('book.ratings_count')}
              </span> */}
            </div>
            <section className={styles['about-section']}>
              <h2 className={styles['about-title']}>{t('book.about')}</h2>
              <p className={styles['about-text']}>
                {fullBookDetails.description}
              </p>
            </section>

            <section className={styles['genres-section']}>
              <h2 className={styles['section-title']}>{t('book.themes')}</h2>
              <div className={styles['genres-container']}>
                {fullBookDetails.themes?.map((theme, index) => (
                  <button key={index} className={styles['genre-chip']}>
                    {theme.name}
                  </button>
                ))}
              </div>
            </section>

            {/* <button
              className={styles['reviews-button']}
              onClick={() => onNavigateToReviews(fullBookDetails.id)}
            >
              {t('book.view_all_reviews')}
            </button> */}
            {/* <CommentsSection
              bookId={fullBookDetails.id}
              canReview={true}
              onNavigateToReviews={onNavigateToReviews}
            /> */}
            <BookTabs
              canReview={fullBookDetails.isReviewable} // your actual condition
              discussionCount={fullBookDetails.commentsCount ?? 10}
              reviewsCount={fullBookDetails.reviewsCount}
              bookId={fullBookDetails.id}
              isAuth={isAuth}
              userReviewId={userReview ? userReview.id : null}
              userCurrentScore={userReview ? userReview.score : 0}
              userReviewText={userReview?.text}
              userReviewStatus={userReview?.status}
              onRatingChanged={() => {
                refetchBook();
                refetchReviews();
              }}
              // infoContent={<p>Дополнительная информация о книге...</p>}
              infoContent={
                <ParticipantsInfo
                  participants={fullBookDetails.participants}
                  roles={roles ?? []}
                />
              }
            />
          </div>
          <button
            className={styles['read-button']}
            disabled={!defaultBookFileId}
            onClick={() => onReadClick(defaultBookFileId)}
          >
            {defaultBookFileId ? t('book.read') : t('book.no_files_available')}
          </button>
        </div>
      </div>
      {isReportOpen && (
        <ReportModal
          targetId={fullBookDetails.id}
          targetTypeId={TARGET_TYPE.BOOK}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
};
