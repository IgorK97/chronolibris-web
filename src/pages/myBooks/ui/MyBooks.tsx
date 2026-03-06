// import React, { useState, useRef } from 'react';
// import { useTranslation } from 'react-i18next';
// import {
//   BookOpen,
//   Settings2,
//   Plus,
//   MoreVertical,
//   Edit3,
//   Trash2,
//   Menu,
// } from 'lucide-react';
// import { useStore } from '../../../stores/globalStore';
// import { useShelves, collectionsApi } from '../../../api/collections';
// import { BookListByCategory } from './BookListByCategory'; // Переделаем его ниже
// import styles from './MyBooks.module.css';

// export const MyBooks = () => {
//   const { t } = useTranslation();
//   const { user, setCurrentBook } = useStore();
//   const { data: shelves, refetch: refetchShelves } = useShelves(
//     user?.userId || 0
//   );

//   const [activeShelfId, setActiveShelfId] = useState<number>(1); // По умолчанию "Избранное"
//   const [isEditShelfModal, setIsEditShelfModal] = useState<{
//     id: number;
//     name: string;
//   } | null>(null);

//   const handleCreateShelf = async () => {
//     const name = prompt(t('mybooks.enter_shelf_name'));
//     if (name) {
//       await collectionsApi.createShelf(name);
//       refetchShelves();
//     }
//   };

//   const handleRenameShelf = async (id: number, oldName: string) => {
//     const newName = prompt(t('mybooks.rename_shelf'), oldName);
//     if (newName && newName !== oldName) {
//       await collectionsApi.updateShelf(id, newName);
//       refetchShelves();
//     }
//   };

//   const handleDeleteShelf = async (id: number) => {
//     if (window.confirm(t('mybooks.confirm_delete_shelf'))) {
//       await collectionsApi.deleteShelf(id);
//       refetchShelves();
//       setActiveShelfId(1);
//     }
//   };

//   return (
//     <div className={styles.layout}>
//       {/* ЛЕВАЯ ЧАСТЬ: Список полок */}
//       <aside className={styles.sidebar}>
//         <header className={styles.sidebarHeader}>
//           <BookOpen size={20} />
//           <span>{t('mybooks.my_books')}</span>
//         </header>

//         <nav className={styles.shelfList}>
//           {shelves?.map((shelf) => (
//             <div
//               key={shelf.id}
//               className={`${styles.shelfItem} ${activeShelfId === shelf.id ? styles.active : ''}`}
//               onClick={() => setActiveShelfId(shelf.id)}
//             >
//               <div className={styles.shelfInfo}>
//                 <span className={styles.shelfName}>{shelf.name}</span>
//                 <span className={styles.bookCount}>{shelf.bookCount ?? 0}</span>
//               </div>

//               {/* Иконка управления (три линии/настройки) */}
//               <button
//                 className={styles.shelfActionBtn}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   // Системные полки (1, 2 и т.д.) обычно нельзя удалять/менять
//                   if (shelf.shelfType === 0) {
//                     handleRenameShelf(shelf.id, shelf.name);
//                   }
//                 }}
//               >
//                 <Menu size={16} />
//               </button>

//               {shelf.shelfType === 0 && (
//                 <button
//                   className={styles.deleteBtn}
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     handleDeleteShelf(shelf.id);
//                   }}
//                 >
//                   <Trash2 size={14} />
//                 </button>
//               )}
//             </div>
//           ))}

//           <button className={styles.addShelfBtn} onClick={handleCreateShelf}>
//             <Plus size={18} />
//             {t('mybooks.add_shelf')}
//           </button>
//         </nav>
//       </aside>

//       {/* ПРАВАЯ ЧАСТЬ: Сетка книг */}
//       <main className={styles.mainContent}>
//         <BookListByCategory
//           // Используем shelfId напрямую
//           shelfId={activeShelfId}
//           onNavigateToBook={(id) => console.log('Navigate to', id)}
//           setCurrentBook={setCurrentBook}
//         />
//       </main>
//     </div>
//   );
// };

// MyBooks.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus, Menu, Edit3, Trash2 } from 'lucide-react';
import { useStore } from '../../../stores/globalStore';
import { useShelves, collectionsApi } from '../../../api/collections';
import { BookListByCategory } from './BookListByCategory';
import styles from './MyBooks.module.css';

export const MyBooks = ({
  onNavigateToBook,
}: {
  onNavigateToBook: (id: number) => void;
}) => {
  const { t } = useTranslation();
  const { user } = useStore();
  const { data: shelves, refetch: refetchShelves } = useShelves(
    user?.userId || 0
  );
  const [activeShelfId, setActiveShelfId] = useState<number>(1);
  const [shelfMenuId, setShelfMenuId] = useState<number | null>(null);

  const handleRename = async (id: number, currentName: string) => {
    const name = prompt('Новое название:', currentName);
    if (name && name !== currentName) {
      await collectionsApi.updateShelf(id, name);
      refetchShelves();
    }
    setShelfMenuId(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить полку?')) {
      await collectionsApi.deleteShelf(id);
      refetchShelves();
      setActiveShelfId(1);
    }
    setShelfMenuId(null);
  };

  return (
    <div className={styles['layout']}>
      <aside className={styles['sidebar']}>
        <div className={styles['sidebar-header']}>
          <BookOpen size={20} /> <h2>{t('mybooks.my_books')}</h2>
        </div>

        <nav className={styles['shelf-list']}>
          {shelves?.map((shelf) => (
            <div
              key={shelf.id}
              className={`${styles['shelf-item']} ${activeShelfId === shelf.id ? styles.active : ''}`}
              onClick={() => setActiveShelfId(shelf.id)}
            >
              <div className={styles['shelf-main']}>
                <span className={styles['shelf-name']}>{shelf.name}</span>
                {/* <span className={styles.count}>{shelf.bookCount || 0}</span> */}
              </div>

              <div className={styles['shelf-action-btn']}>
                <button
                  onClick={(e) => {
                    // e.stopPropagation();
                    // setShelfMenuId(shelf.id);
                    e.stopPropagation();
                    // Если меню этой полки уже открыто — закрываем (null), иначе открываем
                    setShelfMenuId((prev) =>
                      prev === shelf.id ? null : shelf.id
                    );
                  }}
                >
                  <Menu size={16} />
                </button>
                {shelfMenuId === shelf.id && (
                  <div className={styles['shelf-popup']}>
                    <button onClick={() => handleRename(shelf.id, shelf.name)}>
                      <Edit3 size={14} /> Переименовать
                    </button>
                    {shelf.shelfType === 0 && (
                      <button
                        onClick={() => handleDelete(shelf.id)}
                        className={styles['danger']}
                      >
                        <Trash2 size={14} /> Удалить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            className={styles['add-shelf-btn']}
            onClick={() => handleRename(0, '')}
          >
            <Plus size={18} /> Добавить полку
          </button>
        </nav>
      </aside>

      <main className={styles['main-content']}>
        <BookListByCategory
          shelfId={activeShelfId}
          onNavigateToBook={onNavigateToBook}
        />
      </main>
    </div>
  );
};
