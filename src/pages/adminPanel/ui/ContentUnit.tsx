// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// // File: src/components/ContentUnit.tsx
// import React, { useState } from 'react';
// import {
//   useContentById,
//   useContentBooks,
//   useUnlinkBookFromContent,
//   useLinkBookToContent,
// } from '@/api/contents';
// // import { useBooks } from '../api/books';
// import type { ContentDto, BookDto, BookFilterRequest } from '@/types/types';
// import { BookSearchPopup } from './BookSearchPopup';
// import styles from './ContentUnit.module.css';
// import { useNavigate, useParams } from 'react-router-dom';
// import { ContentTagsManager } from './ContentTagsManagement';
// import { ContentThemeManager } from '../Themes/ContentThemeManager';

// interface ContentUnitProps {
//   contentId: number;
//   onBack: () => void;
// }

// export const ContentUnit = () => {
//   const { contentId } = useParams<{ contentId: string }>();
//   const navigate = useNavigate();
//   const id = contentId ? parseInt(contentId, 10) : null;

//   const { data: content, isLoading, error } = useContentById(id);
//   const { data: books, refetch: refetchBooks } = useContentBooks(id);
//   const unlinkMutation = useUnlinkBookFromContent();
//   const linkMutation = useLinkBookToContent();

//   const [showBookSearch, setShowBookSearch] = useState(false);

//   const handleUnlinkBook = async (bookId: number) => {
//     if (window.confirm('Отвязать эту книгу от контента?')) {
//       try {
//         await unlinkMutation.mutateAsync({ contentId: id!, bookId });
//         refetchBooks();
//       } catch (err: any) {
//         alert(err.response?.data?.message || 'Ошибка');
//       }
//     }
//   };

//   const handleAddBook = async (book: BookDto) => {
//     if (window.confirm(`Добавить книгу "${book.title}" к этому контенту?`)) {
//       try {
//         await linkMutation.mutateAsync({
//           contentId: id!,
//           bookId: book.id,
//           data: {
//             contentId: id!,
//             bookId: book.id,
//             order: (books?.length || 0) + 1,
//           },
//         });
//         setShowBookSearch(false);
//         refetchBooks();
//       } catch (err: any) {
//         alert(err.response?.data?.message || 'Ошибка');
//       }
//     }
//   };

//   //   // В компоненте создания нового контента
//   // const [selectedThemes, setSelectedThemes] = useState<ThemeDto[]>([]);

//   // // ... внутри формы
//   // <ThemeSelector
//   //   selectedThemes={selectedThemes}
//   //   onAdd={(t) => setSelectedThemes([...selectedThemes, t])}
//   //   onRemove={(id) => setSelectedThemes(selectedThemes.filter(t => t.id !== id))}
//   // />
//   // // Темы уйдут в общий объект при нажатии большой кнопки "Создать"

//   const handleBack = () => {
//     navigate('/contents');
//   };

//   if (isLoading) return <div className="loading">Загрузка...</div>;
//   if (error || !content) return <div className="error">Контент не найден</div>;

//   return (
//     <div className={styles['content-unit']}>
//       <div className={styles['content-unit-header']}>
//         <button onClick={handleBack} className={styles['btn btn-secondary']}>
//           ← Назад к списку
//         </button>
//         <h2>{content.title}</h2>
//       </div>

//       {/* Метаданные контента */}
//       <div className={styles['content-metadata']}>
//         <div className={styles['metadata-section']}>
//           <h3>Основная информация</h3>
//           <div className={styles['metadata-grid']}>
//             <div className={styles['metadata-item']}>
//               <label>ID:</label>
//               <span>{content.id}</span>
//             </div>
//             <div className={styles['metadata-item']}>
//               <label>Название:</label>
//               <span>{content.title}</span>
//             </div>
//             <div className={styles['metadata-item']}>
//               <label>Описание:</label>
//               <span>{content.description}</span>
//             </div>
//             <div className={styles['metadata-item']}>
//               <label>Тип:</label>
//               <span>{content.contentType}</span>
//             </div>
//             <div className={styles['metadata-item']}>
//               <label>Язык:</label>
//               <span>{content.languageName}</span>
//             </div>
//             <div className={styles['metadata-item']}>
//               <label>Страна:</label>
//               <span>{content.countryName}</span>
//             </div>
//             <div className={styles['metadata-item']}>
//               <label>Год:</label>
//               <span>{content.year || '—'}</span>
//             </div>
//             <div className={styles['metadata-item']}>
//               <label>Авторы:</label>
//               <span>{content.authors.join(', ') || '—'}</span>
//             </div>
//             <div className={styles['metadata-item']}>
//               <label>Темы:</label>
//               <ContentThemeManager
//                 contentId={content.id}
//                 initialThemes={content.themes}
//               />
//               {/* <span>{content.themes.map((t) => t.name).join(', ') || '—'}</span> */}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Управление тегами */}
//       {id && <ContentTagsManager contentId={id} />}

//       {/* Список книг */}
//       <div className={styles['books-section']}>
//         <div className={styles['books-header']}>
//           <h3>Книги ({books?.length || 0})</h3>
//           <button
//             onClick={() => setShowBookSearch(true)}
//             className={styles['btn btn-primary']}
//           >
//             + Добавить книгу
//           </button>
//         </div>

//         <table className={styles['books-table']}>
//           <thead>
//             <tr>
//               <th>ID</th>
//               <th>Название</th>
//               <th>ISBN</th>
//               <th>Издательство</th>
//               <th>Серия</th>
//               <th>Доступно</th>
//               <th>Действия</th>
//             </tr>
//           </thead>
//           <tbody>
//             {books?.map((book, index) => (
//               <tr key={book.id}>
//                 <td>{book.id}</td>
//                 <td>{book.title}</td>
//                 <td>{book.isbn || '—'}</td>
//                 <td>{book.publisherName || '—'}</td>
//                 <td>{book.seriesName || '—'}</td>
//                 <td>{book.isAvailable ? '✓' : '✗'}</td>
//                 <td>
//                   <button
//                     onClick={() => handleUnlinkBook(book.id)}
//                     className={styles['btn btn-danger btn-sm']}
//                     disabled={unlinkMutation.isPending}
//                   >
//                     Отвязать
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Попап поиска книг */}
//       {showBookSearch && (
//         <BookSearchPopup
//           onClose={() => setShowBookSearch(false)}
//           onSelectBook={handleAddBook}
//           currentContentId={id!}
//         />
//       )}
//     </div>
//   );
// };

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useContentById,
  useCreateContent,
  usePatchContent,
  // useContentBooks,
} from '@/api/contents';
import { useLanguages, useCountries, useFormats } from '@/api/references';
import { usePersons } from '@/api/persons';
import { ThemeSelector } from '../Themes/ThemeSelector';
import { ContentTagsManager } from './ContentTagsManagement';
import type { ThemeDto, PersonDto } from '@/types/types';
import styles from './ContentUnit.module.css'; // Используем существующие стили

export const ContentForm = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(contentId);
  const id = contentId ? parseInt(contentId, 10) : null;

  // --- API Data ---
  const { data: content, isLoading: isContentLoading } = useContentById(id);
  const { data: languages } = useLanguages();
  const { data: countries } = useCountries();
  const { data: contentTypes } = useFormats(); // Предполагаем, что форматы = типы контента
  const { data: allPersons } = usePersons();

  // --- Mutations ---
  const createMutation = useCreateContent();
  const patchMutation = usePatchContent();

  // --- Form State ---
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    countryId: 0,
    contentTypeId: 0,
    languageId: 0,
    year: undefined as number | undefined,
    personIds: [] as number[],
    themeIds: [] as number[],
  });

  // Локальное состояние для отображения выбранных объектов (для чипов)
  const [selectedThemes, setSelectedThemes] = useState<ThemeDto[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<PersonDto[]>([]);

  // Инициализация при редактировании
  useEffect(() => {
    if (isEditMode && content) {
      setFormData({
        title: content.title,
        description: content.description,
        countryId: content.countryId || 0,
        contentTypeId: content.contentTypeId || 0,
        languageId: content.languageId || 0,
        year: content.year || undefined,
        personIds: content.personIds || [],
        themeIds: content.themes?.map((t) => t.id) || [],
      });
      setSelectedThemes(content.themes || []);
      // Если в content.authors приходят только строки,
      // нужно будет сопоставить их с allPersons для получения объектов
    }
  }, [isEditMode, content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requestData = {
      ...formData,
      themeIds: selectedThemes.map((t) => t.id),
      personIds: selectedAuthors.map((p) => p.id),
      year: formData.year || null,
    };

    try {
      if (isEditMode && id) {
        await patchMutation.mutateAsync({ id, ...requestData });
        alert('Обновлено успешно');
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newId = await createMutation.mutateAsync(requestData as any);
        navigate(`/contents/${newId}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при сохранении');
    }
  };

  if (isEditMode && isContentLoading) return <div>Загрузка...</div>;

  return (
    <div className={styles['content-unit']}>
      <div className={styles['content-unit-header']}>
        <button
          onClick={() => navigate('/contents')}
          className={styles['btn btn-secondary']}
        >
          ← Назад
        </button>
        <h2>
          {isEditMode
            ? `Редактирование: ${content?.title}`
            : 'Создание нового контента'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className={styles['metadata-section']}>
        <div className={styles['metadata-grid']}>
          {/* Название */}
          <div className={styles['metadata-item']}>
            <label>Название:</label>
            <input
              className={styles.input}
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          {/* Описание */}
          <div className={styles['metadata-item']}>
            <label>Описание:</label>
            <textarea
              className={styles.input}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Тип документа (Content Type) */}
          <div className={styles['metadata-item']}>
            <label>Вид документа:</label>
            <select
              value={formData.contentTypeId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contentTypeId: Number(e.target.value),
                })
              }
            >
              <option value={0}>Выберите тип...</option>
              {contentTypes?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Язык */}
          <div className={styles['metadata-item']}>
            <label>Язык:</label>
            <select
              value={formData.languageId}
              onChange={(e) =>
                setFormData({ ...formData, languageId: Number(e.target.value) })
              }
            >
              <option value={0}>Выберите язык...</option>
              {languages?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Страна */}
          <div className={styles['metadata-item']}>
            <label>Страна:</label>
            <select
              value={formData.countryId}
              onChange={(e) =>
                setFormData({ ...formData, countryId: Number(e.target.value) })
              }
            >
              <option value={0}>Выберите страну...</option>
              {countries?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Год */}
          <div className={styles['metadata-item']}>
            <label>Год:</label>
            <input
              type="number"
              className={styles.input}
              value={formData.year || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  year: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>

          {/* Выбор Авторов (Персон) */}
          <div className={styles['metadata-item']}>
            <label>Авторы:</label>
            <PersonSimpleSelector
              allPersons={allPersons || []}
              selectedAuthors={selectedAuthors}
              onAdd={(p) => setSelectedAuthors([...selectedAuthors, p])}
              onRemove={(pid) =>
                setSelectedAuthors(selectedAuthors.filter((a) => a.id !== pid))
              }
            />
          </div>

          {/* Выбор ТЕМ */}
          <div className={styles['metadata-item']}>
            <label>Темы:</label>
            <ThemeSelector
              selectedThemes={selectedThemes}
              onAdd={(t) => setSelectedThemes([...selectedThemes, t])}
              onRemove={(tid) =>
                setSelectedThemes(selectedThemes.filter((t) => t.id !== tid))
              }
            />
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            type="submit"
            className={styles['btn btn-primary']}
            disabled={createMutation.isPending || patchMutation.isPending}
          >
            {isEditMode ? 'Сохранить изменения' : 'Создать контент'}
          </button>
        </div>
      </form>

      {/* Теги доступны только после создания (или можно добавить в общую форму) */}
      {isEditMode && id && (
        <div style={{ marginTop: '30px' }}>
          <h3>Управление тегами</h3>
          <ContentTagsManager contentId={id} />
        </div>
      )}
    </div>
  );
};

/**
 * Вспомогательный мини-компонент для выбора авторов
 * По логике похож на ThemeSelector, но работает со списком персон
 */
const PersonSimpleSelector = ({
  allPersons,
  selectedAuthors,
  onAdd,
  onRemove,
}: {
  allPersons: PersonDto[];
  selectedAuthors: PersonDto[];
  onAdd: (p: PersonDto) => void;
  onRemove: (id: number) => void;
}) => {
  const [query, setQuery] = useState('');

  const suggestions = allPersons
    .filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) &&
        !selectedAuthors.some((a) => a.id === p.id)
    )
    .slice(0, 5);

  return (
    <div className={styles.selectorContainer}>
      <input
        type="text"
        placeholder="Поиск автора..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.input}
      />
      {query && suggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {suggestions.map((p) => (
            <li
              key={p.id}
              onClick={() => {
                onAdd(p);
                setQuery('');
              }}
            >
              {p.name}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.chipList}>
        {selectedAuthors.map((a) => (
          <span key={a.id} className={styles.chip}>
            {a.name} <button onClick={() => onRemove(a.id)}>&times;</button>
          </span>
        ))}
      </div>
    </div>
  );
};
