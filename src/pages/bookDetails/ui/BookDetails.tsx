import {
  ArrowLeft,
  Bookmark,
  Heart,
  Download,
  ListPlus,
  X,
  Cog,
} from 'lucide-react';
import styles from './BookDetails.module.css';
import { useStore } from '../../../stores/globalStore';
import { useBookDetails } from '../../../api/books';
import { useRoles } from '../../../api/references';
import { pluralize } from '@/utils';
import type {
  BookDetails,
  // ShelfDetails
} from '../../../types';
import {
  collectionsApi,
  // useSeekedShelves,
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
// import { BookTabs } from './BookTabs/BookTabs';
import { ParticipantsInfo } from './BookTabs/ParticipantsInfo';
import {
  useCreateReview,
  useDeleteReview,
  useInfiniteReviews,
  useMyReview,
  useUpdateReview,
} from '@/api/reviews';
import { bookFilesApi, useBookFiles } from '@/api/bookFiles';
import Circles from 'react-loading-icons/dist/esm/components/circles';
import { ReportModal } from '@/components/reports/ReportModal';
import { TARGET_TYPE } from '@/types';
import { Flag } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShelfSelectionModal } from '@/pages/MyBooks/ui/ShelfSelectionModal';
import { GenreChip } from '@/components/GenreChip';
import { TagChip } from '@/components';
import { BookTabs } from './BookTabs';
import { AlertDialog } from '@/components/dialogs/AlertDialog';
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

const FORMAT_EXTENSIONS: Record<number, string> = ['fb2'];

function getAuthorsString(
  authorRoleId: number,
  bookDetails: BookDetails
): string {
  const authorGroup = bookDetails.participants?.find(
    (group) => group.role === authorRoleId
  );
  if (!authorGroup || authorGroup.persons.length === 0)
    return 'Неизвестный автор';
  return authorGroup.persons.map((person) => person.fullName).join(', ');
}

export const BookDetailsComponent = ({
  onNavigateToBack,
  onReadClick,
}: BookDetailsProps) => {
  const { setCurrentBook, user, isReader } = useStore();
  const { data: roles } = useRoles();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { id: bookId } = useParams();
  const { data: shelves, refetch: refetchShelves } = useShelves(
    user?.userId || 0
  );

  const isAuth = !!user;
  const FAVORITES_SHELF_ID = shelves?.find((s) => s.shelfType === 1)?.id;
  const READ_SHELF_ID = shelves?.find((s) => s.shelfType === 2)?.id;

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isRatingPopupOpen, setIsRatingPopupOpen] = useState(false);
  const ratingRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isShelfPanelOpen, setIsShelfPanelOpen] = useState(false);

  const handleMouseEnter = () => {
    if (user?.role !== 'reader') return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsRatingPopupOpen(true);
  };
  const {
    data: fullBookDetails,
    refetch: refetchBook,
    isLoading,
    isError,
  } = useBookDetails(
    Number(bookId) || 0,
    String(user?.userId || 0),
    user?.role == 'admin' || user?.role == 'moderator' ? true : false,
    !!Number(bookId)
  );

  const { data: bookFiles } = useBookFiles(Number(bookId) || 0);
  const navigate = useNavigate();

  const [isDownloadPanelOpen, setIsDownloadPanelOpen] =
    useState<boolean>(false);

  const defaultBookFileId =
    bookFiles?.find((f) => f.isReadable)?.id ?? bookFiles?.[0]?.id;

  const { refetch: refetchReviews } = useInfiniteReviews(
    Number(bookId) || 0,
    isAuth
  );
  const { data: userReview } = useMyReview(Number(bookId) || 0, isAuth);

  const createReview = useCreateReview(Number(bookId) || 0);
  const updateReview = useUpdateReview(Number(bookId) || 0);
  const deleteReview = useDeleteReview(Number(bookId) || 0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const handleMouseLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    closeTimerRef.current = setTimeout(() => {
      setIsRatingPopupOpen(false);
      setHoverRating(0);
    }, 300);
  };
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);
  const handleRateBook = async (rating: number) => {
    if (!user || !bookId) return;

    if (userReview) {
      await updateReview.mutateAsync({
        reviewId: userReview.id,
        score: rating,
        reviewText: userReview.text || undefined,
      });
    } else {
      await createReview.mutateAsync({
        bookId: Number(bookId) || 0,
        score: rating,
      });
    }
    setIsRatingPopupOpen(false);
  };

  if (isLoading) return <div className={styles.loader}>Загрузка...</div>;
  if (isError || !fullBookDetails)
    return (
      <p className={styles.errorText}>
        Ошибка загрузки книги, попробуйте еще раз
      </p>
    );

  const authorRoleId = roles?.find((role) => role.name === 'Автор')?.id ?? 1;
  const authors = getAuthorsString(authorRoleId, fullBookDetails);
  const toggleShelfAction = async (
    shelfId: number | undefined,
    isCurrentStatus: boolean
  ) => {
    if (!user || !shelfId) return;
    const success = !isCurrentStatus
      ? await collectionsApi.addBookToShelf(shelfId, fullBookDetails.id)
      : await collectionsApi.removeBookFromShelf(shelfId, fullBookDetails.id);

    if (success) refetchBook();
  };

  const handleDelete = async () => {
    await deleteReview.mutateAsync(userReview?.id ?? 0);
    setIsRatingPopupOpen(false);
    setDeleteModalOpen(false);
  };

  const handleDownload = async (bookFileId: number, formatId: number) => {
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

        {user && (
          <div className={styles['header-icons']}>
            {user.role == 'reader' && (
              <div style={{ display: 'flex', flexDirection: 'row' }}>
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
                    {fullBookDetails.isRead
                      ? t('book.read_done')
                      : t('book.to_read')}
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
                    fill={
                      fullBookDetails.isFavorite ? fillFavColor : fillUnfavColor
                    }
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
              </div>
            )}
            {bookFiles && bookFiles.length > 0 && (
              <button
                className={styles['icon-button']}
                onClick={() => setIsDownloadPanelOpen((prev) => !prev)}
              >
                <Download size={24} />
                <span className={styles['button-label']}>
                  {t('book.download')}
                </span>
              </button>
            )}
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
                        <X style={{ cursor: 'pointer' }} />
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
                            onClick={() =>
                              handleDownload(file.id, file.formatId)
                            }
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
                      <p className={styles['download-error']}>
                        {downloadError}
                      </p>
                    )}
                  </div>
                </div>,
                document.body
              )}
            {user.role == 'admin' && (
              <button
                className={styles['icon-button']}
                onClick={() => {
                  navigate(`/books/${fullBookDetails.id}`);
                }}
              >
                <Cog style={{ cursor: 'pointer' }} size={24} />
                <span className={styles['button-label']}>
                  {t('book.settings')}
                </span>
              </button>
            )}
          </div>
        )}
      </header>

      <div className={styles['scroll-container']}>
        <div className={styles['book-body']}>
          <div className={styles['cover-container']}>
            {fullBookDetails.coverUri ? (
              <img
                src={getImageUrl(fullBookDetails.coverUri)}
                alt={fullBookDetails.title}
                className={styles['cover']}
              />
            ) : (
              <div className={styles['image-placeholder']}>
                <span className={styles['image-placeholder-title']}>
                  {fullBookDetails.title}
                </span>
              </div>
            )}
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
                          {/* {t('book.ratings_count')} */}
                          {pluralize(
                            fullBookDetails.ratingsCount,
                            t('book.rating.one'),
                            t('book.rating.few'),
                            t('books.rating.many')
                          )}
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
                          {userReview && (
                            <div className={styles['delete-section']}>
                              <hr className={styles['separator']} />
                              <button
                                className={styles['delete-review-btn']}
                                onClick={async () => {
                                  setDeleteModalOpen(true);
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
                        {/* {t('book.review_count')} */}
                        {pluralize(
                          fullBookDetails.reviewsCount,
                          t('book.review.one'),
                          t('book.review.few'),
                          t('book.review.many')
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                  <GenreChip
                    key={index}
                    onClick={() => {
                      navigate(`/search?themeId=${theme.id}`);
                    }}
                    genreName={theme.name}
                  />
                ))}
              </div>
            </section>

            <section className={styles['genres-section']}>
              <h2 className={styles['section-title']}>Теги</h2>
              <div className={styles['genres-container']}>
                {fullBookDetails.tags?.map((tag, index) => (
                  <TagChip
                    key={index}
                    disabled={true}
                    tagName={tag.name}
                    tagTypeName={tag.tagTypeName}
                    onClick={() => {
                      navigate(`/search?tagIncl=${tag.id}`);
                    }}
                  />
                ))}
              </div>
            </section>
          </div>
          {user && (
            <button
              className={styles['read-button']}
              disabled={!defaultBookFileId}
              onClick={() => onReadClick(defaultBookFileId)}
            >
              {defaultBookFileId ? t('book.read') : t('book.no_read_available')}
            </button>
          )}
        </div>
        <BookTabs
          canReview={fullBookDetails.isReviewable}
          isReviewable={fullBookDetails.isReviewable}
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
          infoContent={
            <ParticipantsInfo
              bookInfo={fullBookDetails}
              participants={fullBookDetails.participants}
              roles={roles ?? []}
            />
          }
        />
      </div>
      {isReportOpen &&
        createPortal(
          <ReportModal
            targetId={fullBookDetails.id}
            targetTypeId={TARGET_TYPE.BOOK}
            onClose={() => setIsReportOpen(false)}
          />,
          document.body
        )}
      {isShelfPanelOpen &&
        createPortal(
          <ShelfSelectionModal
            bookId={fullBookDetails.id}
            onClose={() => setIsShelfPanelOpen(false)}
            onRefresh={refetchShelves}
          />,
          document.body
        )}
      <AlertDialog
        description={`Это действие нельзя будет отменить. Оценка будет удалена вместе с отзывом`}
        open={deleteModalOpen}
        title={`Вы действительно хотите удалить оценку?`}
        handleAccept={() => {
          handleDelete();
        }}
        handleReject={() => {
          setDeleteModalOpen(false);
        }}
      />
    </div>
  );
};
