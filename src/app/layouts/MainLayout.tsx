// import { useStore } from '@/stores/globalStore';
// import React from 'react';
import styles from './MainLayout.module.css';
import {
  Outlet,
  // useNavigate
} from 'react-router-dom';
// import { usersApi } from '@/api/user';
import Header from '@/components/header/ui/Header';
import Footer from '@/components/footer';
// import { ReaderProvider } from "./vendor/epubjs-react-web"; // Гипотетический аналог
// import { ReferenceDataProvider } from "../shared/contexts/ReferenceDataProvider";
// import { useColorScheme } from "../shared/lib/hooks/use-color-scheme";

export default function MainLayout() {
  //   const colorScheme = useColorScheme();

  // const { user, setUser } = useStore();
  // const navigate = useNavigate();

  // const handleLogout = async () => {
  //   try {
  //     await usersApi.logout(); // notify server to delete cookie
  //     setUser(null); // clear user from client store
  //     navigate('/auth'); // redirect to login page
  //   } catch (error) {
  //     console.error('Logout failed', error);
  //     // Even if server fails, we can still clear local state
  //     setUser(null);
  //     navigate('/auth');
  //   }
  // };

  return (
    <div className="app-container light">
      {/* {user && (
        <header className={styles.header}>
          <div className={styles.bar}>
            <span>Welcome, {user.email}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </header>
      )}
      {!user && (
        <header className={styles.header}>
          <div className={styles.bar}>
            <span>Welcome to ELibrary</span>
            <button
              onClick={() => navigate('/auth')}
              className={styles.logoutButton}
            >
              Log-in
            </button>
          </div>
        </header>
      )} */}
      <Header />
      <main className={styles['main-content']}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
