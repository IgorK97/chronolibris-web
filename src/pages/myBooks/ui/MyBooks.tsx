import {
  // React,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react'; // Веб-версия lucide
import { useStore } from '../../../stores/globalStore';
// import { useColorScheme } from "@/src/shared/lib/hooks/use-color-scheme";
// import { Colors } from "@/src/shared/lib/constants/theme";
import { BookListByCategory } from './BookCategoryList';
import styles from './MyBooks.module.css';

interface MyBooksProps {
  onNavigateToBook: (id: number) => void;
}

export const MyBooks = ({ onNavigateToBook }: MyBooksProps) => {
  const { t } = useTranslation();
  //   const color = useColorScheme();
  const { setCurrentBook } = useStore();

  const tabs = [
    { id: 1, label: 'Избранное' },
    { id: 2, label: 'Прочитанные' },
    { id: -1, label: 'История чтения' },
    { id: 0, label: 'Загруженные' },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  //   // Определяем переменные темы (в реальном проекте это лучше делать через провайдер или класс на body)
  //   const themeVars = {
  //     "--bg-color":
  //       color === "light" ? Colors.light.background : Colors.dark.background,
  //     "--text-color": color === "light" ? "#000" : "#fff",
  //     "--border-color": color === "light" ? "#eee" : "#333",
  //     "--icon-bg": "#D32F2F", // Пример цвета
  //     "--icon-color": "#fff",
  //   } as React.CSSProperties;

  return (
    <div
      className={styles['container']}
      // style={themeVars}
    >
      {/* Заголовок */}
      <header className={styles['header']}>
        <div className={styles['headerIcon']}>
          <BookOpen size={20} />
        </div>
        <h1 className={styles['header-title']}>{t('mybooks.my_books')}</h1>
      </header>

      {/* Навигация по табам */}
      <nav className={styles['tabs-wrapper']}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles['tab-button']} ${
              activeTab === tab.id ? styles['tab-button-active'] : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Контент списка */}
      <div className={styles['content']}>
        <BookListByCategory
          CategoryId={activeTab}
          onNavigateToBook={onNavigateToBook}
          setCurrentBook={setCurrentBook}
        />
      </div>
    </div>
  );
};
