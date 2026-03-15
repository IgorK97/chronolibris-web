// components/Selections/SelectionsList.tsx
import React from 'react';
import { useSelections } from '@/api/collections';
import styles from './SelectionsList.module.css';

interface SelectionsListProps {
  onSelectSelection: (selectionId: number) => void;
}

export const SelectionsList: React.FC<SelectionsListProps> = ({
  onSelectSelection,
}) => {
  const { data, isLoading, error } = useSelections(1, 20);

  if (isLoading) return <div className={styles['loading']}>Загрузка...</div>;
  if (error) return <div className={styles['error']}>Ошибка загрузки</div>;

  return (
    <div className={styles['container']}>
      <h2 className={styles['title']}>Подборки</h2>
      <div className={styles['grid']}>
        {data?.items.map((selection) => (
          <div
            key={selection.id}
            className={styles['card']}
            onClick={() => onSelectSelection(selection.id)}
          >
            <h3 className={styles['card-Title']}>{selection.name}</h3>
            <p className={styles['description']}>{selection.description}</p>
            <div className={styles['meta']}>
              <span>Книг: {selection.booksCount}</span>
              <span>
                {new Date(selection.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
