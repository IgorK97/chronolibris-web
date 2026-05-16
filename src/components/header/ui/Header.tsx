import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/globalStore';
import styles from './Header.module.css';
import { useEffect, useRef, useState } from 'react';
import { Library, Search, ShieldCheck, UserStar } from 'lucide-react';
import { CatalogPanel } from '@/pages/Search/';
import { AdminSidebar } from '@/components/AdminSideBar/AdminSideBar';

export default function Header() {
  const { user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminOpen, setAdminOpen] = useState(false);
  // const searchParams = new URLSearchParams(location.search);
  const currentQuery = new URLSearchParams(location.search).get('q') ?? '';
  const [inputValue, setInputValue] = useState(currentQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  useEffect(() => {
    setInputValue(currentQuery);
  }, [currentQuery]);

  const handleSearch = () => {
    const trimmed = inputValue.trim();

    const hasOtherFilters = (() => {
      const params = new URLSearchParams(location.search);
      params.delete('q');
      return params.toString().length > 0;
    })();

    if (!trimmed && !hasOtherFilters) return;

    //Если уже на /search, нужно поменять только q, остальные фильтры сохранить
    if (location.pathname === '/search') {
      const updated = new URLSearchParams(location.search);
      if (trimmed) {
        updated.set('q', trimmed);
      } else {
        updated.delete('q');
      }
      navigate(`/search?${updated.toString()}`, { replace: false });
    } else {
      //С других страниц - переход с новым запросом, там фильтров нет никаких
      const params = new URLSearchParams();
      if (trimmed) params.set('q', trimmed);
      navigate(`/search?${params.toString()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') inputRef.current?.blur();
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles['nav-row']}>
          <div className={styles['left-section']}>
            <Link to="/" className={styles.logo}>
              Chronolibris
            </Link>
            <button
              className={styles['catalog-btn']}
              onClick={() => setCatalogOpen(!catalogOpen)}
            >
              Каталог
            </button>
          </div>
          <div className={styles['center-section']}>
            <div className={styles['search-wrapper']}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Введите название книги..."
                value={inputValue}
                className={styles['search-input']}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Search style={{ cursor: 'pointer' }} onClick={handleSearch} />
            </div>
          </div>
          <div className={styles['right-section']}>
            {user ? (
              <>
                {user.role == 'admin' && (
                  <UserStar
                    style={{ cursor: 'pointer' }}
                    onClick={() => setAdminOpen(true)}
                  />
                )}
                {(user.role == 'moderator' || user.role == 'admin') && (
                  <ShieldCheck
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/moderation')}
                  />
                )}
                {user.role == 'reader' && (
                  <Link to="/mybooks" className={styles['catalog-btn']}>
                    <span className={styles['catalog-btn-label']}>
                      Мои книги
                    </span>
                    {<Library className={styles['catalog-btn-icon']} />}
                  </Link>
                )}
                <Link to="/profile" className={styles['profile-icon']}>
                  {user.userName?.charAt(0).toUpperCase() || 'U'}
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth?mode=login')}
                  className={styles['login-btn']}
                >
                  Войти
                </button>
                <button
                  onClick={() => navigate('/auth?mode=register')}
                  className={styles['register-btn']}
                >
                  Зарегистрироваться
                </button>
              </>
            )}
          </div>
        </div>
        <div className={styles['search-row']}>
          <div className={styles['search-wrapper']}>
            <input
              type="text"
              placeholder="Введите название книги..."
              value={inputValue}
              className={styles['search-input']}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Search onClick={handleSearch} />
          </div>
        </div>
      </header>

      <CatalogPanel
        isOpen={catalogOpen}
        onClose={() => setCatalogOpen(false)}
      />
      <AdminSidebar isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
    </>
  );
}
