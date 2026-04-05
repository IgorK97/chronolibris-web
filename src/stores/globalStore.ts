import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookListItem, UserProfile } from '../types/types';

interface AppState {
  user: UserProfile | null;
  currentBook: BookListItem | null;
  isInitialized: boolean; // Новый флаг
  setUser: (user: UserProfile | null) => void;
  setCurrentBook: (book: BookListItem | null) => void;
  setInitialized: (val: boolean) => void;
  clearStore: () => void;
  isReader: () => boolean;
  isModerator: () => boolean;
  isAdmin: () => boolean;
}

export const USER_ROLES = {
  READER: 'reader',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      currentBook: null,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setCurrentBook: (book) => set({ currentBook: book }),
      setInitialized: (val) => set({ isInitialized: val }),
      clearStore: () => {
        set({ currentBook: null, user: null, isInitialized: true });
        localStorage.removeItem('elibrary-app-storage');
      },
      isReader: () => get().user?.role === USER_ROLES.READER,
      isModerator: () => get().user?.role === USER_ROLES.MODERATOR,
      isAdmin: () => get().user?.role === USER_ROLES.ADMIN,
    }),
    {
      name: 'elibrary-app-storage',
      // В вебе persist сам выгрузит данные из localStorage в стейт при загрузке страницы
    }
  )
);
