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
    <div className={styles['app-container']}>
      <Header />
      <main className={styles['main-content']}>
        <Outlet />
      </main>
      {/* <Footer /> */}
    </div>
  );
}
