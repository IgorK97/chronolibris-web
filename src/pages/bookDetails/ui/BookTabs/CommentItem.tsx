import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  commentsApi,
  // useRateComment
} from '@/api/comments';
import {
  Avatar,
  // VoteButton,
  ComposeBox,
  ScoreDisplay,
  ThreeDotsMenu,
  VoteButton,
} from './BookTabsAtoms';
import { formatDate } from './BookTabsData';
import type { CommentDto } from '@/types/types';
import { useStore } from '@/stores/globalStore';
import styles from './BookTabs.module.css';

const MAX_INDENT_DEPTH = 3; // После 3 уровня перестаем сдвигать вправо

export function CommentItem({
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
  const qc = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [showMore, setShowMore] = useState(false);
  // const rateMutation = useRateComment(
  //   bookId,
  //   comment.parentCommentId || undefined
  // );
  // Загрузка дочерних комментариев по требованию
  const {
    data: fetchedReplies,
    // isLoading
  } = useQuery({
    queryKey: ['comments', 'replies', comment.id],
    queryFn: () => commentsApi.getReplies(comment.id),
    enabled: showMore,
    staleTime: 0,
  });

  // const handleVote = (score: number) => {
  //   if (!isAuth) {
  //     alert('Нужно авторизоваться');
  //     return;
  //   }

  //   // Если пользователь нажимает на ту же кнопку, мы обычно "снимаем" голос (score: 0)
  //   // Но для простоты реализуем базовую логику:
  //   rateMutation.mutate({ commentId: comment.id, score });
  // };

  const repliesQueryKey = ['comments', 'replies', comment.id];

  const deleteMutation = useMutation({
    mutationFn: () => commentsApi.delete(comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', bookId] }),
  });

  const handleHideReplies = () => {
    setShowMore(false);
    // Полностью удаляем данные об ответах этого комментария из кеша React Query
    qc.removeQueries({ queryKey: repliesQueryKey });
  };

  // Совмещаем превью-ответы с сервера и дозагруженные
  const allReplies = fetchedReplies || [];
  const hasReplies = comment.repliesCount > 0;

  // Решение проблемы вложенности: сдвиг только до предела, линии всегда
  const indentStyle = {
    marginLeft: depth > 0 && depth <= MAX_INDENT_DEPTH ? '24px' : '0px',
    borderLeft: depth > 0 ? '2px solid var(--border-color, #e5e7eb)' : 'none',
    paddingLeft: depth > 0 ? '16px' : '0px',
  };

  const userName =
    comment.userLogin == null || comment.userLogin == undefined
      ? '[Недоступно]'
      : comment.userLogin;

  console.log(userName, 'Kukusiki');
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
  const handleVote = async (type: 'like' | 'dislike') => {
    if (!isAuth) return; // guard: must be authenticated to vote
    const score = type === 'like' ? 1 : -1;

    // Optimistic UI update
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

    await commentsApi.rateComment({
      commentId: comment.id,
      score,
    });
  };
  return (
    <div className={styles['comment-wrapper']} style={indentStyle}>
      <div className={styles['comment-item']}>
        <div className={styles['comment-header']}>
          <Avatar userName={userName} />
          <div className={styles['comment-meta']}>
            <span className={styles['author-name']}>{userName}</span>
            <span className={styles['comment-date']}>
              {formatDate(comment.createdAt)}
            </span>
          </div>
          {user?.userName === comment.userLogin && (
            <ThreeDotsMenu
              canDelete={true}
              onDelete={async () => deleteMutation.mutate()}
            />
          )}
        </div>

        <div className={styles['comment-text']}>
          {comment.text == null ? '[Комментарий удалён]' : comment.text}
        </div>

        <div className={styles['comment-footer']}>
          {/* Группа кнопок голосования */}
          <div className={styles['vote-group']}>
            <VoteButton
              type="like"
              count={votes.likes}
              active={votes.userVote === 'like'}
              onClick={() => handleVote('like')}
            />
            <ScoreDisplay likes={votes.likes} dislikes={votes.dislikes} />
            <VoteButton
              type="dislike"
              count={votes.dislikes}
              active={votes.userVote === 'dislike'}
              onClick={() => handleVote('dislike')}
            />
          </div>
          <button
            className={styles['reply-btn']}
            onClick={() => setIsReplying(!isReplying)}
          >
            Ответить
          </button>
        </div>

        {isReplying && (
          <div className={styles['reply-compose']}>
            <ComposeBox
              type="comment"
              placeholder="Ваш ответ..."
              onSubmit={async (text) => {
                await commentsApi.create({
                  bookId,
                  text,
                  parentCommentId: comment.id,
                });
                setIsReplying(false);
                setShowMore(true); // Показываем ветку после ответа
                qc.invalidateQueries({
                  queryKey: ['comments', 'replies', comment.id],
                });
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
      {/* {hasReplies && !showMore && (
        <button
          className={styles['show-more-btn']}
          onClick={() => setShowMore(true)}
        >
          <span>+ Показать ответы ({comment.repliesCount})</span>
        </button>
      )}

 
      {hasReplies && showMore && (
        <button
          className={styles['show-more-btn']}
          onClick={() => setShowMore(false)}
        >
          <span>- Скрыть ответы ({comment.repliesCount})</span>
        </button>
      )} */}

      {showMore && hasReplies && (
        <div className={styles['replies-container']}>
          {allReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              bookId={bookId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
