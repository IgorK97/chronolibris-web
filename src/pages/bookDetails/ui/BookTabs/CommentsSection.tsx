import {} from // ComposeBox,
// SmartTextBox,
'./BookTabsAtoms';
import { SmartTextBox } from './SmartTextBox';
import styles from './BookTabs.module.css';
import { useInfiniteQuery } from '@tanstack/react-query';
import { commentsApi } from '@/api/comments';
import {
  // CommentItem,
  SmartCommentItem,
} from './CommentItem';
import { useStore } from '@/stores/globalStore';

export function CommentsSection({ bookId }: { bookId: number }) {
  const { user } = useStore();
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
      {user?.role == 'reader' && (
        <SmartTextBox
          type="comment"
          placeholder="Напишите комментарий..."
          onSubmit={async (text) => {
            await commentsApi.create({ bookId, text });
            refetch();
          }}
        />
      )}

      <div className={styles['comment-list']}>
        {allComments.map((c) => (
          <SmartCommentItem key={c.id} comment={c} bookId={bookId} />
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
