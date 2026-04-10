import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './AdminSidebar.module.css';
import {
  BookOpen,
  FileText,
  Globe,
  Layers,
  // List,
  Tag,
  Users,
  ShieldCheck,
  X,
  BookMarked,
  Building2,
  User,
  Palette,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Управление книгами и контентами',
    items: [
      { label: 'Создать книгу', path: '/books/new', icon: BookOpen },
      { label: 'Контенты', path: '/contents', icon: FileText },
      { label: 'Подборки', path: '/selections', icon: Layers },
    ],
  },
  {
    title: 'Справочники',
    items: [
      { label: 'Языки', path: '/lang', icon: Globe },
      { label: 'Страны', path: '/country', icon: Globe },
      // { label: 'Форматы', path: '/format', icon: List },
      { label: 'Издатели', path: '/publisher', icon: Building2 },
      { label: 'Персоны', path: '/person', icon: User },
      { label: 'Темы', path: '/themes', icon: Palette },
      { label: 'Теги', path: '/tags', icon: Tag },
    ],
  },
  {
    title: 'Администрирование',
    items: [
      { label: 'Модерация', path: '/moderation', icon: ShieldCheck },
      {
        label: 'Регистрация сотрудников',
        path: '/register-staff',
        icon: Users,
      },
    ],
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  //Чтобы по нажатии на esc скрылась панель
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  //Чтобы по переходу скрылась панель
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles['backdrop-visible'] : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* aside? */}
      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${isOpen ? styles['sidebar-open'] : ''}`}
        aria-label="Панель администратора"
        role="navigation"
      >
        <div className={styles.header}>
          <div className={styles['header-title']}>
            <BookMarked size={18} />
            <span>Администрирование</span>
          </div>
          <button
            className={styles['close-btn']}
            onClick={onClose}
            aria-label="Закрыть панель"
          >
            <X size={18} />
          </button>
        </div>

        <nav className={styles.nav}>
          {SECTIONS.map((section) => (
            <div key={section.title} className={styles.section}>
              <p className={styles['section-title']}>{section.title}</p>
              <ul className={styles.list}>
                {section.items.map(({ label, path, icon: Icon }) => {
                  const isActive = location.pathname === path;
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        className={`${styles.link} ${isActive ? styles['link-active'] : ''}`}
                      >
                        <Icon size={15} className={styles['link-icon']} />
                        <span>{label}</span>
                        {isActive && <span className={styles['active-dot']} />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
