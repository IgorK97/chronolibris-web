/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
// import {
//   // useInfiniteQuery,
//   // useMutation,
//   useQueryClient,
// } from '@tanstack/react-query';
import {
  // commentsApi,
  useCreateComment,
  useDeleteComment,
  useGetRepliesByComment,
  useRateComment,
} from '@/api/comments';
import {
  Avatar,
  // ComposeBox,
  ScoreDisplay,
  ThreeDotsMenu,
  VoteButton,
} from './BookTabsAtoms';
import { formatDate } from '@/utils';
import type { CommentDto } from '@/types';
import { useStore } from '@/stores/globalStore';
import styles from './BookTabs.module.css';
import { TARGET_TYPE } from '@/types';
import { renderFormattedText } from './utils';
import { SmartTextBox } from './SmartTextBox';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';

const MAX_INDENT_DEPTH = 3; // После 3 уровня вправо больше не сдвигается

export function SmartCommentItem({
  comment,
  depth = 0,
  bookId,
}: {
  comment: CommentDto;
  depth?: number;
  bookId: number;
}) {
  const { user } = useStore();
  const isAuth = !!user;
  // const qc = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [opened, setOpened] = useState(!comment.deletedAt);

  const {
    data: infiniteReplies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetRepliesByComment(comment.id, showMore);
  // } = useInfiniteQuery({
  //   queryKey: ['comments', 'replies', comment.id],
  //   queryFn: ({ pageParam }) => commentsApi.getReplies(comment.id, pageParam),
  //   initialPageParam: undefined as number | undefined,
  //   getNextPageParam: (lastPage) =>
  //     lastPage.length > 0 ? lastPage[lastPage.length - 1].id : undefined,
  //   enabled: showMore,
  //   staleTime: 0,
  // });

  useEffect(() => {
    setOpened(!comment.deletedAt);
  }, [comment]);

  const allReplies = infiniteReplies?.pages.flat() || [];
  // const repliesQueryKey = ['comments', 'replies', comment.id];

  // const deleteMutation = useMutation({
  //   mutationFn: () => commentsApi.delete(comment.id),
  //   onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', bookId] }),
  // });

  const handleHideReplies = () => {
    setShowMore(false);
    // qc.removeQueries({ queryKey: repliesQueryKey });
  };

  const hasReplies = comment.repliesCount > 0;

  const indentStyle = {
    marginLeft: depth > 0 && depth <= MAX_INDENT_DEPTH ? '24px' : '0px',
    borderLeft: depth > 0 ? '2px solid var(--border-color, #e5e7eb)' : 'none',
    paddingLeft: depth > 0 ? '16px' : '0px',
  };

  const userName = user?.userName;

  // console.log(userName, 'Kukusiki');
  const [votes, setVotes] = useState({
    likes: comment.likesCount,
    dislikes: comment.dislikesCount,

    userVote:
      comment.userVote === true
        ? 'like'
        : comment.userVote === false
          ? 'dislike'
          : null,
  } as {
    likes: number;
    dislikes: number;
    userVote: 'like' | 'dislike' | null;
  });
  const { mutateAsync: rateComment } = useRateComment(bookId, comment.id);
  const { mutateAsync: deleteComment } = useDeleteComment();
  const handleVote = async (type: 'like' | 'dislike') => {
    if (!isAuth) return;
    console.log('VOTE');

    const score = type === 'like' ? 1 : -1;

    //Оптимистичное обновление
    setVotes((prev) => {
      if (prev.userVote === type) {
        return {
          likes: type === 'like' ? prev.likes - 1 : prev.likes,
          dislikes: type === 'dislike' ? prev.dislikes - 1 : prev.dislikes,
          userVote: null,
        };
      }
      return {
        likes:
          type === 'like'
            ? prev.likes + 1
            : prev.userVote === 'like'
              ? prev.likes - 1
              : prev.likes,
        dislikes:
          type === 'dislike'
            ? prev.dislikes + 1
            : prev.userVote === 'dislike'
              ? prev.dislikes - 1
              : prev.dislikes,
        userVote: type,
      };
    });

    await rateComment({
      commentId: comment.id,
      score,
    });
  };

  const { mutateAsync: createComment } = useCreateComment();
  return !opened ? (
    <div className={styles['comment-wrapper-del']} style={indentStyle}>
      {' '}
      <button
        className={styles['star-pick-btn']}
        style={{ color: 'black' }}
        onClick={() => setOpened(true)}
      >
        +
      </button>{' '}
      <p>{'[Удалено]'}</p>
    </div>
  ) : (
    <div className={styles['comment-wrapper']} style={indentStyle}>
      <div className={styles['comment-item']}>
        <div className={styles['comment-header']}>
          <Avatar userName={comment.userLogin || 'U'} />
          <div className={styles['comment-meta']}>
            <span className={styles['author-name']}>{comment.userLogin}</span>
            <span className={styles['comment-date']}>
              {formatDate(comment.createdAt)}
            </span>
          </div>
          {user?.role == 'reader' && user?.userName === comment.userLogin ? (
            <ThreeDotsMenu
              canDelete={true}
              onDelete={async () =>
                deleteComment({
                  id: comment.id,
                  bookId,
                  parentCommentId: comment.parentCommentId,
                })
              }
              targetId={comment.id}
              targetTypeId={TARGET_TYPE.COMMENT}
            />
          ) : (
            <ThreeDotsMenu
              canReport={comment.deletedAt ? false : true}
              canDelete={false}
              onDelete={async () => {}}
              targetId={comment.id}
              targetTypeId={TARGET_TYPE.COMMENT}
            />
          )}
        </div>

        <div className={styles['comment-text-smart']}>
          {/* {comment.text == null ? '[Комментарий удалён]' : comment.text} */}
          {renderFormattedText(comment.text!)}
        </div>

        <div className={styles['comment-footer']}>
          <div className={styles['vote-group']}>
            {comment.deletedAt && (
              <button
                className={styles['star-pick-btn']}
                style={{ color: 'black' }}
                onClick={() => setOpened(false)}
              >
                -
              </button>
            )}
            <VoteButton
              disabled={!!comment.deletedAt || comment.userLogin === userName}
              type="like"
              count={votes.likes}
              active={votes.userVote === 'like'}
              onClick={() => {
                console.log(!!comment.deletedAt);
                handleVote('like');
              }}
            />
            <ScoreDisplay likes={votes.likes} dislikes={votes.dislikes} />
            <VoteButton
              disabled={!!comment.deletedAt || comment.userLogin === userName}
              type="dislike"
              count={votes.dislikes}
              active={votes.userVote === 'dislike'}
              onClick={() => handleVote('dislike')}
            />
          </div>
          {user?.role == 'reader' && !comment.deletedAt && (
            <button
              className={styles['reply-btn']}
              onClick={() => setIsReplying(!isReplying)}
            >
              Ответить
            </button>
          )}
        </div>

        {isReplying && (
          <div className={styles['reply-compose']}>
            <SmartTextBox
              type="comment"
              placeholder="Ваш ответ..."
              onSubmit={async (text) => {
                await createComment({
                  bookId,
                  text,
                  parentCommentId: comment.id,
                });
                setIsReplying(false);
                setShowMore(true);
                // qc.invalidateQueries({
                //   queryKey: ['comments', 'replies', comment.id],
                // });
              }}
            />
          </div>
        )}
      </div>

      {hasReplies && (
        <button
          className={styles['show-more-btn']}
          onClick={showMore ? handleHideReplies : () => setShowMore(true)}
        >
          <span>
            {showMore ? '-' : '+'}{' '}
            {showMore ? 'Скрыть ответы' : 'Показать ответы'} (
            {comment.repliesCount})
          </span>
        </button>
      )}

      {showMore && hasReplies && (
        <div className={styles['replies-container']}>
          {allReplies.map((reply) => (
            <SmartCommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              bookId={bookId}
            />
          ))}
          {hasNextPage && (
            <button
              className={styles['load-more-replies']}
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              style={{
                marginLeft: '24px',
                fontSize: '0.85rem',
                marginTop: '8px',
              }}
            >
              {isFetchingNextPage ? 'Загрузка...' : 'Загрузить еще ответы'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
