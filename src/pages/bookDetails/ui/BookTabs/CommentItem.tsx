import { useState } from 'react';
import {
  // useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { commentsApi } from '@/api/comments';
import {
  Avatar,
  // VoteButton, ThreeDotsMenu,
  ComposeBox,
} from './BookTabsAtoms';
import { formatDate } from './BookTabsData';
import type { CommentDto } from '@/types/types';
// import { useStore } from '@/stores/globalStore';
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
  //   const { user } = useStore();
  const qc = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Загрузка дочерних комментариев по требованию
  const {
    data: fetchedReplies,
    // isLoading
  } = useQuery({
    queryKey: ['comments', 'replies', comment.id],
    queryFn: () => commentsApi.getReplies(comment.id),
    enabled: showMore,
  });

  //   const deleteMutation = useMutation({
  //     mutationFn: () => commentsApi.delete(comment.id),
  //     onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', bookId] }),
  //   });

  // Совмещаем превью-ответы с сервера и дозагруженные
  const allReplies = fetchedReplies || comment.replies || [];
  const hasReplies = allReplies.length > 0;

  // Решение проблемы вложенности: сдвиг только до предела, линии всегда
  const indentStyle = {
    marginLeft: depth > 0 && depth <= MAX_INDENT_DEPTH ? '24px' : '0px',
    borderLeft: depth > 0 ? '2px solid var(--border-color, #e5e7eb)' : 'none',
    paddingLeft: depth > 0 ? '16px' : '0px',
  };

  return (
    <div className={styles['comment-wrapper']} style={indentStyle}>
      <div className={styles['comment-item']}>
        <div className={styles['comment-header']}>
          <Avatar userName={`User ${comment.userId}`} />
          <div className={styles['comment-meta']}>
            <span className={styles['author-name']}>
              Пользователь {comment.userId}
            </span>
            <span className={styles['comment-date']}>
              {formatDate(comment.createdAt)}
            </span>
          </div>
          {/* {user?.id === comment.userId && (
            <ThreeDotsMenu onDelete={() => deleteMutation.mutate()} />
          )} */}
        </div>

        <div className={styles['comment-text']}>{comment.text}</div>

        <div className={styles['comment-footer']}>
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

      {/* Логика отображения дочерних элементов */}
      {hasReplies && !showMore && depth === 0 && (
        <button
          className={styles['show-more-btn']}
          onClick={() => setShowMore(true)}
        >
          <span>+ Показать ответы ({allReplies.length})</span>
        </button>
      )}

      {(showMore || depth > 0) && hasReplies && (
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
