import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookListItem, UserProfile } from '../types';

export interface CachedPerson {
  id: number;
  name: string;
}

export interface CachedTag {
  id: number;
  name: string;
  matchedName: string | null;
}

export interface FilterNamesCache {
  persons: Record<number, CachedPerson>;
  tags: Record<number, CachedTag>;
}

interface AppState {
  user: UserProfile | null;
  currentBook: BookListItem | null;
  isInitialized: boolean;

  filterNamesCache: FilterNamesCache;
  cachePersons: (persons: CachedPerson[]) => void;
  cacheTags: (tags: CachedTag[]) => void;
  removePersons: (ids: number[]) => void;
  removeTags: (ids: number[]) => void;

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
const EMPTY_CACHE: FilterNamesCache = { persons: {}, tags: {} };

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      currentBook: null,
      isInitialized: false,
      filterNamesCache: EMPTY_CACHE,

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

      cachePersons: (persons) =>
        set((state) => {
          const next = { ...state.filterNamesCache.persons };
          for (const p of persons) next[p.id] = p;
          return {
            filterNamesCache: { ...state.filterNamesCache, persons: next },
          };
        }),

      cacheTags: (tags) =>
        set((state) => {
          const next = { ...state.filterNamesCache.tags };
          for (const t of tags) next[t.id] = t;
          return {
            filterNamesCache: { ...state.filterNamesCache, tags: next },
          };
        }),

      removePersons: (ids) =>
        set((state) => {
          const next = { ...state.filterNamesCache.persons };
          for (const id of ids) delete next[id];
          return {
            filterNamesCache: { ...state.filterNamesCache, persons: next },
          };
        }),
      removeTags: (ids) =>
        set((state) => {
          const next = { ...state.filterNamesCache.tags };
          for (const id of ids) delete next[id];
          return {
            filterNamesCache: { ...state.filterNamesCache, tags: next },
          };
        }),
    }),
    { name: 'elibrary-app-storage' }
  )
);
