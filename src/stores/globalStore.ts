import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookListItem, UserProfile } from "../types/types";

interface AppState {
  user: UserProfile | null;
  currentBook: BookListItem | null;
  isInitialized: boolean; // Новый флаг
  setUser: (user: UserProfile | null) => void;
  setCurrentBook: (book: BookListItem | null) => void;
  setInitialized: (val: boolean) => void;
  clearStore: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      currentBook: null,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setCurrentBook: (book) => set({ currentBook: book }),
      setInitialized: (val) => set({ isInitialized: val }),
      clearStore: () => {
        set({ currentBook: null, user: null, isInitialized: true });
        localStorage.removeItem("elibrary-app-storage");
      },
    }),
    {
      name: "elibrary-app-storage",
      // В вебе persist сам выгрузит данные из localStorage в стейт при загрузке страницы
    },
  ),
);

// interface AppState {
//   currentBook: BookListItem | null;
//   user: UserProfile | null;
//   shelves: ShelfDetails[] | null;
//   setCurrentBook: (book: BookListItem | null) => void;
//   setUser: (user: UserProfile | null) => void;
//   setShelves: (shelves: ShelfDetails[] | null) => void;
//   clearStore: () => void;
// }

// export const useStore = create<AppState>()(
//   persist(
//     (set) => ({
//       currentBook: null,
//       user: null,
//       shelves: null,

//       setCurrentBook: (book) => set({ currentBook: book }),

//       setUser: (user) => set({ user }),

//       setShelves: (shelves) => set({ shelves }),

//       clearStore: () => {
//         set({ currentBook: null, user: null, shelves: null });
//         localStorage.removeItem("app-storage"); // Полная очистка
//       },
//     }),
//     {
//       name: "app-storage", // Ключ в localStorage
//       storage: createJSONStorage(() => localStorage), // В вебе используем стандартный localStorage
//     },
//   ),
// );
