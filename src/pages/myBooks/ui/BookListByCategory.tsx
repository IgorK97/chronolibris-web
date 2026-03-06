// import React, { useEffect, useRef } from 'react';
// import { useStore } from '../../../stores/globalStore';
// // import { BookCard } from '../../../components/books';
// import type {
//   // BookDetails,
//   BookListItem,
// } from '../../../types/types';
// import {
//   useInfiniteReadBooks,
//   useInfiniteShelfBooks,
// } from '../../../api/books';
// import styles from './BookCategoryList.module.css';
// import { collectionsApi, useShelves } from '../../../api/collections';
// import { ManagedBookCard } from './ManagedBookCard';

// interface BookListByCategoryProps {
//   CategoryId: number; // -1: История, -2: Локальные, >0: Полки
//   onNavigateToBook: (id: number) => void;
//   setCurrentBook: (book: BookListItem) => void;
// }

// export const BookListByCategory = ({
//   CategoryId,
//   setCurrentBook,
//   onNavigateToBook,
// }: BookListByCategoryProps) => {
//   const { user } = useStore(); // Больше не берем shelves отсюда
//   const observerTarget = useRef<HTMLDivElement>(null);

//   // Получаем полки через React Query
//   const { data: shelves, isLoading: isShelvesLoading } = useShelves(
//     user?.userId || 0
//   );

//   // Определяем ID полки
//   // const SHELF_ID = shelves?.find((s) => s.shelfType === CategoryId)?.id;

//   // Запросы к книгам
//   const readQuery = useInfiniteReadBooks(user?.userId || 0);
//   const shelfQuery = useInfiniteShelfBooks(user?.userId || 0, shelfId);

//   // Ключевой момент: запрос не начнется, пока SHELF_ID не определен (через enabled)
//   // const shelfQuery = useInfiniteShelfBooks(user?.userId || 0, SHELF_ID);

//   const activeQuery = CategoryId === -1 ? readQuery : shelfQuery;
//   const {
//     data,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//     isLoading: isBooksLoading,
//   } = activeQuery;

//   // ... логика Infinite Scroll (без изменений) ...

//   const isLoading = isShelvesLoading || isBooksLoading;
//   // Infinite Scroll logic
//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
//           fetchNextPage();
//         }
//       },
//       { threshold: 0.1 }
//     );

//     if (observerTarget.current) observer.observe(observerTarget.current);
//     return () => observer.disconnect();
//   }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
//   if (isLoading && !data) {
//     return <div className={styles.centerLoader}>Загрузка...</div>;
//   }

//   const navigateToBookHandler = (book: BookListItem) => {
//     setCurrentBook(book);
//     onNavigateToBook(book.id);
//   };

//   const allBooks = data?.pages.flatMap((page) => page.items) || [];

//   if (isLoading) {
//     return <div className={styles.centerLoader}>Загрузка списка книг...</div>;
//   }

//   return (
//     <div className={styles['container']}>
//       <div className={styles['grid']}>
//         {allBooks.map((book) => (
//           <ManagedBookCard
//             key={book.id}
//             book={book}
//             onPress={() => navigateToBookHandler(book)}
//             onRemove={async (id: number) => {
//               await collectionsApi.removeBookFromShelf(shelfId, id);
//               shelfQuery.refetch(); // Обновляем список
//             }}
//             onEdit={(book) => {
//               // Здесь вызываем тот же UI-компонент/модалку,
//               // который вы использовали в BookDetails.tsx (shelf-panel)
//               setSelectedBookForEdit(book);
//               setIsShelfModalOpen(true);
//             }}
//           />
//         ))}
//       </div>

//       <div ref={observerTarget} className={styles['sentinel']}>
//         {isFetchingNextPage && (
//           <div className={styles.centerLoader}>Подгружаем...</div>
//         )}
//       </div>
//     </div>
//   );
// };

// BookCategoryList.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../../stores/globalStore';
import { useInfiniteShelfBooks } from '../../../api/books';
import { collectionsApi } from '../../../api/collections';
import { ManagedBookCard } from './ManagedBookCard';
import { ShelfSelectionModal } from './ShelfSelectionModal';
import styles from './BookCategoryList.module.css';
import type { BookListItem } from '@/types/types';

interface Props {
  shelfId: number;
  onNavigateToBook: (id: number) => void;
}

export const BookListByCategory = ({ shelfId, onNavigateToBook }: Props) => {
  const { user, setCurrentBook } = useStore();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [editingBook, setEditingBook] = useState<BookListItem | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // isLoading,
    refetch,
  } = useInfiniteShelfBooks(user?.userId || 0, shelfId);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allBooks = data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className={styles['container']}>
      <div className={styles['grid']}>
        {allBooks.map((book) => (
          <ManagedBookCard
            key={book.id}
            book={book}
            onPress={() => {
              setCurrentBook(book);
              onNavigateToBook(book.id);
            }}
            onRemove={async (id) => {
              await collectionsApi.removeBookFromShelf(shelfId, id);
              refetch();
            }}
            onEdit={(book) => setEditingBook(book)}
          />
        ))}
      </div>

      <div ref={observerTarget} className={styles['sentinel']}>
        {isFetchingNextPage && <div>Загрузка...</div>}
      </div>

      {editingBook && (
        <ShelfSelectionModal
          bookId={editingBook.id}
          onClose={() => setEditingBook(null)}
          onRefresh={refetch}
        />
      )}
    </div>
  );
};
