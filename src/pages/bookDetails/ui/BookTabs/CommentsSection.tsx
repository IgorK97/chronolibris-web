// import { useState, useRef } from 'react';
// import { ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react';
// import type { Comment } from './BookTabsData';
// import { MOCK_COMMENTS, formatDate } from './BookTabsData';
import {
  // Avatar,
  // VoteButton,
  // ScoreDisplay,
  // ThreeDotsMenu,
  ComposeBox,
} from './BookTabsAtoms';
import styles from './BookTabs.module.css';
import { useInfiniteQuery } from '@tanstack/react-query';
import { commentsApi } from '@/api/comments';
import { CommentItem } from './CommentItem';

// ─── Single comment ───────────────────────────────────────────────────────────

// function CommentItem({
//   comment,
//   depth = 0,
//   onReply,
// }: {
//   comment: Comment;
//   depth?: number;
//   onReply: (parentId: number, authorName: string) => void;
// }) {
//   const [votes, setVotes] = useState({
//     likes: comment.likes,
//     dislikes: comment.dislikes,
//     userVote: comment.userVote ?? null,
//   });
//   const [repliesOpen, setRepliesOpen] = useState(false);
//   const indentLevel = Math.min(depth, 3);
//   const hasReplies = !!comment.replies?.length;

//   const handleVote = (type: 'like' | 'dislike') => {
//     setVotes((prev) => {
//       if (prev.userVote === type) {
//         return {
//           likes: type === 'like' ? prev.likes - 1 : prev.likes,
//           dislikes: type === 'dislike' ? prev.dislikes - 1 : prev.dislikes,
//           userVote: null,
//         };
//       }
//       return {
//         likes:
//           type === 'like'
//             ? prev.likes + 1
//             : prev.userVote === 'like'
//               ? prev.likes - 1
//               : prev.likes,
//         dislikes:
//           type === 'dislike'
//             ? prev.dislikes + 1
//             : prev.userVote === 'dislike'
//               ? prev.dislikes - 1
//               : prev.dislikes,
//         userVote: type,
//       };
//     });
//   };

//   return (
//     <div
//       className={`${styles['comment']} ${styles[`comment--depth-${indentLevel}`]}`}
//     >
//       {depth > 0 && <div className={styles['thread-line']} />}
//       <div className={styles['comment-inner']}>
//         <Avatar author={comment.author} />
//         <div className={styles['comment-body']}>
//           <div className={styles['comment-header']}>
//             <span className={styles['comment-author']}>
//               {comment.author.name}
//             </span>
//             <span className={styles['comment-date']}>
//               {formatDate(comment.createdAt)}
//             </span>
//             <ThreeDotsMenu />
//           </div>

//           <p className={styles['comment-text']}>{comment.text}</p>

//           <div className={styles['comment-footer']}>
//             <div className={styles['vote-group']}>
//               <VoteButton
//                 type="like"
//                 count={votes.likes}
//                 active={votes.userVote === 'like'}
//                 onClick={() => handleVote('like')}
//               />
//               <ScoreDisplay likes={votes.likes} dislikes={votes.dislikes} />
//               <VoteButton
//                 type="dislike"
//                 count={votes.dislikes}
//                 active={votes.userVote === 'dislike'}
//                 onClick={() => handleVote('dislike')}
//               />
//             </div>

//             <button
//               className={styles['reply-btn']}
//               onClick={() => onReply(comment.id, comment.author.name)}
//             >
//               <CornerDownRight size={13} />
//               Ответить
//             </button>

//             {hasReplies && (
//               <button
//                 className={styles['expand-btn']}
//                 onClick={() => setRepliesOpen((v) => !v)}
//               >
//                 {repliesOpen ? (
//                   <ChevronUp size={14} />
//                 ) : (
//                   <ChevronDown size={14} />
//                 )}
//                 {repliesOpen
//                   ? 'Скрыть ответы'
//                   : `Ответы (${comment.replies!.length})`}
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {repliesOpen && hasReplies && (
//         <div className={styles['replies']}>
//           {comment.replies!.map((reply) => (
//             <CommentItem
//               key={reply.id}
//               comment={reply}
//               depth={depth + 1}
//               onReply={onReply}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// ─── Comments section ─────────────────────────────────────────────────────────

// type SortMode = 'popular' | 'recent';

// export function CommentsSection() {
//   const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
//   const [sort, setSort] = useState<SortMode>('popular');
//   const [replyingTo, setReplyingTo] = useState<{
//     parentId: number;
//     authorName: string;
//   } | null>(null);
//   const composeRef = useRef<HTMLDivElement>(null);

//   const sorted = [...comments].sort((a, b) =>
//     sort === 'popular'
//       ? b.likes - b.dislikes - (a.likes - a.dislikes)
//       : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//   );

//   const handleReply = (parentId: number, authorName: string) => {
//     setReplyingTo({ parentId, authorName });
//     setTimeout(
//       () =>
//         composeRef.current?.scrollIntoView({
//           behavior: 'smooth',
//           block: 'center',
//         }),
//       50
//     );
//   };

//   const handleSubmit = (text: string) => {
//     const newComment: Comment = {
//       id: Date.now(),
//       author: { id: 0, name: 'Вы' },
//       text,
//       createdAt: new Date().toISOString(),
//       likes: 0,
//       dislikes: 0,
//       userVote: null,
//       replies: [],
//     };
//     if (!replyingTo) {
//       setComments((prev) => [newComment, ...prev]);
//     } else {
//       const insertReply = (list: Comment[]): Comment[] =>
//         list.map((c) =>
//           c.id === replyingTo.parentId
//             ? { ...c, replies: [...(c.replies ?? []), newComment] }
//             : { ...c, replies: insertReply(c.replies ?? []) }
//         );
//       setComments((prev) => insertReply(prev));
//     }
//     setReplyingTo(null);
//   };

//   return (
//     <div className={styles['tab-content']}>
//       <div ref={composeRef}>
//         <ComposeBox
//           placeholder="Напишите комментарий, задайте вопрос..."
//           replyingTo={replyingTo}
//           onCancelReply={() => setReplyingTo(null)}
//           onSubmit={handleSubmit}
//           type="comment"
//         />
//       </div>

//       <div className={styles['sort-row']}>
//         <div className={styles['sort-tabs']}>
//           <button
//             className={`${styles['sort-tab']} ${sort === 'popular' ? styles['sort-tab--active'] : ''}`}
//             onClick={() => setSort('popular')}
//           >
//             Популярные
//           </button>
//           <button
//             className={`${styles['sort-tab']} ${sort === 'recent' ? styles['sort-tab--active'] : ''}`}
//             onClick={() => setSort('recent')}
//           >
//             Новые
//           </button>
//         </div>
//         <span className={styles['sort-count']}>
//           {comments.length} комментариев
//         </span>
//       </div>

//       <div className={styles['comment-list']}>
//         {sorted.map((c) => (
//           <CommentItem key={c.id} comment={c} depth={0} onReply={handleReply} />
//         ))}
//       </div>
//     </div>
//   );
// }

export function CommentsSection({ bookId }: { bookId: number }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['comments', bookId],
      queryFn: ({ pageParam }) => commentsApi.getByBookId(bookId, pageParam),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.length > 0 ? lastPage[lastPage.length - 1].id : undefined,
    });

  const allComments = data?.pages.flat() || [];

  return (
    <div className={styles['tab-content']}>
      <ComposeBox
        type="comment"
        placeholder="Напишите комментарий..."
        onSubmit={async (text) => {
          await commentsApi.create({ bookId, text });
          refetch();
        }}
      />

      <div className={styles['comment-list']}>
        {allComments.map((c) => (
          <CommentItem key={c.id} comment={c} bookId={bookId} />
        ))}

        {hasNextPage && (
          <button
            className={styles['load-more']}
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Загрузка...' : 'Загрузить еще'}
          </button>
        )}
      </div>
    </div>
  );
}
