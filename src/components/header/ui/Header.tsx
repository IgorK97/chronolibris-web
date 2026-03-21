// import React from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/globalStore';
// import { usersApi } from '@/api/user';
import styles from './Header.module.css';
import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

export default function Header() {
  const { user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const currentQuery = new URLSearchParams(location.search).get('q') ?? '';
  const [inputValue, setInputValue] = useState(currentQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setInputValue(currentQuery);
  }, [currentQuery]);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') inputRef.current?.blur();
  };

  return (
    <NavigationMenu.Root className={styles['navigation-menu-root']}>
      <NavigationMenu.List className={styles['navigation-menu-list']}>
        <NavigationMenu.Item>
          <Link to="/" className={styles['logo']}>
            Chronolibris
          </Link>
        </NavigationMenu.Item>
        <div className={styles['categories-wrapper']}>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger
              className={styles['navigation-menu-trigger']}
            >
              Категории
            </NavigationMenu.Trigger>
            <NavigationMenu.Content
              className={styles['navigation-menu-content']}
            >
              <ul className={styles['list']}>
                <li>
                  <Link to="/category/history">History</Link>
                </li>
                <li>
                  <Link to="/category/fiction">Fiction</Link>
                </li>
                <li>
                  <Link to="/category/science">Science</Link>
                </li>
              </ul>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <div className={styles['viewport-position']}>
            <NavigationMenu.Viewport
              className={styles['navigation-menu-viewport']}
            />
          </div>
        </div>

        <div className={styles['middle-section']}>
          <div className={styles['search-container']}>
            <input
              ref={inputRef}
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

        {/* RIGHT: Auth Logic */}
        <div className={styles['right-section']}>
          {user ? (
            <>
              <NavigationMenu.Item>
                <Link to="/mybooks" className={styles['navigation-menu-link']}>
                  Мои книги
                </Link>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <Link to="/profile" className={styles['profile-icon']}>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </Link>
              </NavigationMenu.Item>
              {/* <button onClick={handleLogout} className={styles['logout-btn']}>
                Выйти
              </button> */}
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth')}
                className={styles['login-btn']}
              >
                Войти
              </button>
              <button
                onClick={() => navigate('/auth')}
                className={styles['register-btn']}
              >
                Зарегистрироваться
              </button>
            </>
          )}
        </div>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}
