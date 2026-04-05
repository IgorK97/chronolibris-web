// import { useStore } from '@/stores/globalStore';
// import React from 'react';
import styles from './MainLayout.module.css';
import {
  Outlet,
  // useNavigate
} from 'react-router-dom';
import Header from '@/components/header/ui/Header';

export default function MainLayout() {
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
      {/* <Footer /> */}
    </div>
  );
}
