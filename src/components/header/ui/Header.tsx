// import React from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/stores/globalStore';
// import { usersApi } from '@/api/user';
import styles from './Header.module.css';

export default function Header() {
  const { user } = useStore();
  const navigate = useNavigate();

  // const handleLogout = async () => {
  //   try {
  //     await usersApi.logout();
  //     setUser(null);
  //     navigate('/auth');
  //   } catch (error) {
  //     console.error('Logout failed', error);
  //     setUser(null);
  //     navigate('/auth');
  //   }
  // };

  return (
    <NavigationMenu.Root className={styles['navigation-menu-root']}>
      <NavigationMenu.List className={styles['navigation-menu-list']}>
        {/* LEFT: Logo */}
        <NavigationMenu.Item>
          <Link to="/" className={styles['logo']}>
            {/* 📚 ELibrary */}
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
        {/* MIDDLE: Categories & Search */}
        <div className={styles['middle-section']}>
          <div className={styles['search-container']}>
            <input
              type="text"
              placeholder="Искать..."
              className={styles['search-input']}
            />
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
