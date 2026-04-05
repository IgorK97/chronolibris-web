import {
  // React,
  useEffect,
} from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { USER_ROLES, useStore } from '../stores/globalStore';

import MainLayout from './layouts/MainLayout';

import { BookDetailsComponent } from '../pages/bookDetails';
import { Profile } from '../pages/profile';
import { Auth } from '../pages/auth';
// import Reviews from '../pages/reviews';
import Library from '@/pages/library';
import MyBooks from '../pages/myBooks';
import { usersApi } from '../api/user';
import {
  // ModeratorRoute,
  ProtectedRoute,
} from './ProtectedRoute';
// import { SelectionListView } from '../pages/library/ui/SectionList';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ContentManagement,
  CountryManager,
  FormatManager,
  LanguageManager,
  PersonManager,
  PublisherManager,
  // SeriesManager,
  ThemeManager,
} from '@/pages/adminPanel';
import { ContentForm } from '@/pages/adminPanel/ui/ContentUnit';
// import { Reader } from '@/components/Reader';
import { BookManagement } from '@/pages/adminPanel/ui/BookManagement';
import { BookUnit } from '@/pages/adminPanel/ui/BookUnit';
import { SelectionsPage } from '@/pages/adminPanel/Selection/SelectionsPage';
import { TagsPage } from '@/pages/adminPanel/Tags/TagsPage';
import { ReaderPage } from '@/pages/reader/ReaderPage';
import ReaderLayout from './layouts/ReaderLayout';
import { ModerationPage } from '@/pages/moderation/ModerationPage';
import SearchPage from '@/pages/search/ui/SearchPage';
import { RegisterStaffPage } from '@/pages/RegisterStaffPage/RegisterStuffPage';
import { PublicOnlyRoute } from './PublicOnlyRoute';

const queryClient = new QueryClient();

export default function App() {
  const { setUser, isInitialized, setInitialized } = useStore();
  const navigate = useNavigate();
  const handleReadClick = async (bookFileId?: number) => {
    navigate(`/reader/${bookFileId}`);
  };
  useEffect(() => {
    const initApp = async () => {
      // Если в localStorage нашли старого юзера, можно обновить его данные с сервера
      // if (user?.userId) {
      try {
        const freshUser = await usersApi.getProfile();
        setUser(freshUser);
      } catch (e) {
        setUser(null);
        console.error('Session expired or server error', e);
        // Если токен протух, можно разлогинить: setUser(null);
      } finally {
        // }
        setInitialized(true);
      }
    };

    initApp();
  }, []);

  if (!isInitialized) {
    return <div>Загрузка...</div>;
  }
  const handleAuthSuccess = () => {
    navigate('/library');
  };
  const handleBookSelection = (bookId: number) => {
    navigate(`/book/${bookId}`);
  };
  const handleBookListSelection = (selectionId: number) => {
    navigate(`/search/?selectionId=${selectionId}`);
  };
  const handleNavigateToReviews = (bookId: number) => {
    navigate(`/book/${bookId}/reviews`);
  };
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Только неавторизованные */}
          <Route element={<PublicOnlyRoute redirectTo="/library" />}>
            <Route
              path="auth"
              element={<Auth onNavigate={handleAuthSuccess} />}
            />
          </Route>

          {/* Любые пользователи */}
          <Route
            path="search"
            element={<SearchPage onNavigateToBook={handleBookSelection} />}
          />

          <Route
            path="library"
            element={
              <Library
                onNavigateToBook={handleBookSelection}
                onNavigateToList={handleBookListSelection}
              />
            }
          />

          <Route
            path="book/:id"
            element={
              <BookDetailsComponent
                onNavigateToBack={() => navigate(-1)}
                onNavigateToRead={() => {}}
                onReadClick={handleReadClick}
                onNavigateToReviews={handleNavigateToReviews}
              />
            }
          />

          {/* <Route
            path="book/:id/reviews"
            element={<Reviews onNavigate={() => navigate(-1)} />}
          /> */}

          {/* Только модераторы */}
          <Route
            element={<ProtectedRoute allowedRoles={[USER_ROLES.MODERATOR]} />}
          >
            <Route path="moderation" element={<ModerationPage />} />
          </Route>

          {/* Только авторизованные пользователи (любые) */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  USER_ROLES.ADMIN,
                  USER_ROLES.READER,
                  USER_ROLES.MODERATOR,
                ]}
              />
            }
          >
            <Route
              path="profile"
              element={<Profile onNavigate={() => navigate(-1)} />}
            />
          </Route>

          {/* Только читатели */}
          <Route
            element={<ProtectedRoute allowedRoles={[USER_ROLES.READER]} />}
          >
            <Route
              path="mybooks"
              element={<MyBooks onNavigateToBook={handleBookSelection} />}
            />
          </Route>

          {/* Только администраторы */}
          <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
            <Route path="lang" element={<LanguageManager />} />
            <Route path="country" element={<CountryManager />} />
            <Route path="format" element={<FormatManager />} />
            <Route path="publisher" element={<PublisherManager />} />
            <Route path="person" element={<PersonManager />} />

            <Route path="selections" element={<SelectionsPage />} />
            <Route path="themes" element={<ThemeManager />} />
            <Route path="tags" element={<TagsPage />} />

            <Route path="contents" element={<ContentManagement />} />
            <Route path="/contents/new" element={<ContentForm />} />
            <Route path="/contents/:contentId/edit" element={<ContentForm />} />

            <Route path="books" element={<BookManagement />} />
            <Route path="books/:bookId" element={<BookUnit />} />

            <Route path="register-staff" element={<RegisterStaffPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/library" />} />
        </Route>

        {/* Читательский интерфейс, отдельные страницы для чтения книг */}
        <Route element={<ReaderLayout />}>
          <Route
            element={<ProtectedRoute allowedRoles={[USER_ROLES.READER]} />}
          >
            <Route path="reader/:bookFileId" element={<ReaderPage />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}
