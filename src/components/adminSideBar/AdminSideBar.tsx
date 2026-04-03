import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './AdminSidebar.module.css';
import {
  BookOpen,
  FileText,
  Globe,
  Layers,
  List,
  Tag,
  Users,
  ShieldCheck,
  X,
  BookMarked,
  Building2,
  Scroll,
  User,
  Palette,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Контент',
    items: [
      { label: 'Книги', path: '/books', icon: BookOpen },
      { label: 'Материалы', path: '/contents', icon: FileText },
      { label: 'Подборки', path: '/selections', icon: Layers },
      { label: 'Теги', path: '/tags', icon: Tag },
    ],
  },
  {
    title: 'Справочники',
    items: [
      { label: 'Языки', path: '/lang', icon: Globe },
      { label: 'Страны', path: '/country', icon: Globe },
      { label: 'Форматы', path: '/format', icon: List },
      { label: 'Издатели', path: '/publisher', icon: Building2 },
      { label: 'Серии', path: '/series', icon: Scroll },
      { label: 'Персоны', path: '/person', icon: User },
      { label: 'Темы', path: '/themes', icon: Palette },
    ],
  },
  {
    title: 'Управление',
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        aria-label="Панель администратора"
        role="navigation"
      >
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <BookMarked size={18} />
            <span>Администрирование</span>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть панель"
          >
            <X size={18} />
          </button>
        </div>

        <nav className={styles.nav}>
          {SECTIONS.map((section) => (
            <div key={section.title} className={styles.section}>
              <p className={styles.sectionTitle}>{section.title}</p>
              <ul className={styles.list}>
                {section.items.map(({ label, path, icon: Icon }) => {
                  const isActive = location.pathname === path;
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                      >
                        <Icon size={15} className={styles.linkIcon} />
                        <span>{label}</span>
                        {isActive && <span className={styles.activeDot} />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <span className={styles.footerText}>Chronolibris Admin</span>
        </div>
      </aside>
    </>
  );
}
